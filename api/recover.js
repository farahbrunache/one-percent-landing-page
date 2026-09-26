// Gets a lost claim link back. The only thing that works is the card code itself, which the
// buyer has on the card or in their own receipt, and which is never stored in readable form.

import { ensureSchema, sql, underLimit } from '../lib/db.js';
import { callerKey, claimToken, keyedHash, normalizeCardCode } from '../lib/crypto.js';
import { HttpError, handle, readJson, send } from '../lib/http.js';

export default handle('POST', async (req, res) => {
  const body = await readJson(req);
  const code = normalizeCardCode(body.code);
  if (code.length < 8) throw new HttpError(400, 'Enter the gift card code you sent.');

  await ensureSchema();

  if (!(await underLimit('recover', callerKey(req), 8, 3600))) {
    throw new HttpError(429, 'Too many recovery attempts from here in the last hour. Try later.');
  }

  const rows = await sql()`
    select id from orders where card_code_hash = ${keyedHash(code)} limit 1
  `;
  if (!rows.length) {
    throw new HttpError(
      404,
      'No order here was paid for with that code. Check the code, or submit it if you have ' +
        'not yet.',
    );
  }

  // The old token cannot be returned — only its hash was kept — so issue a new one. This
  // retires the previous link, which is the correct outcome for a link somebody has lost.
  const token = claimToken();
  await sql()`
    update orders set claim_token_hash = ${keyedHash(token)} where id = ${rows[0].id}
  `;

  send(res, 200, { claim: `/claim?t=${token}` });
});
