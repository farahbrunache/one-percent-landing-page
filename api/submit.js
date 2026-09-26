// Takes a gift card and returns a claim link. Collects nothing else.

import { ensureSchema, sql, underLimit } from '../lib/db.js';
import {
  callerKey,
  claimToken,
  encrypt,
  keyedHash,
  normalizeCardCode,
} from '../lib/crypto.js';
import { CARD_BRANDS } from '../lib/orders.js';
import { HttpError, handle, readJson, send } from '../lib/http.js';

const DUPLICATE_MESSAGE =
  'That card has already been submitted. If you have lost your link, recover it with the same ' +
  'card code.';

export default handle('POST', async (req, res) => {
  const body = await readJson(req);

  const brand = String(body.brand || '').trim();
  if (!CARD_BRANDS.includes(brand)) {
    throw new HttpError(400, `Pick a card type. Accepted: ${CARD_BRANDS.join(', ')}.`);
  }

  const code = normalizeCardCode(body.code);
  if (code.length < 8) {
    throw new HttpError(
      400,
      'That does not look like a gift card code. Check it and enter it again — dashes and ' +
        'spaces do not matter.',
    );
  }
  if (code.length > 64) {
    throw new HttpError(400, 'That code is longer than any gift card code. Check it.');
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 7 || amount > 500) {
    throw new HttpError(400, 'Enter what the card is worth, in dollars, between 7 and 500.');
  }

  await ensureSchema();

  if (!(await underLimit('submit', callerKey(req), 10, 3600))) {
    throw new HttpError(429, 'Too many submissions from here in the last hour. Try later.');
  }

  const codeHash = keyedHash(normalizeCardCode(code));

  // A code already sitting here is either a duplicate submission or somebody trying to buy
  // twice with one card. Either way it does not create a second order.
  const existing = await sql()`
    select status from orders where card_code_hash = ${codeHash} limit 1
  `;
  if (existing.length) throw new HttpError(409, DUPLICATE_MESSAGE);

  const token = claimToken();

  try {
    await sql()`
      insert into orders (
        claim_token_hash, card_code_hash, card_brand, card_amount_cents, card_code_encrypted
      ) values (
        ${keyedHash(token)}, ${codeHash}, ${brand}, ${Math.round(amount * 100)}, ${encrypt(code)}
      )
    `;
  } catch (error) {
    // Two submissions of one code can pass the check above at the same moment. The unique
    // index is what actually decides it, so say the same thing the check would have said.
    if (String(error.message || '').includes('orders_card_code_hash_idx')) {
      throw new HttpError(409, DUPLICATE_MESSAGE);
    }
    throw error;
  }

  send(res, 201, { claim: `/claim?t=${token}` });
});
