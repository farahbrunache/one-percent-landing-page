// What a claim link shows. The phone number and the access code appear here and nowhere else.

import { ensureSchema, findByClaimTokenHash, underLimit } from '../lib/db.js';
import { callerKey, decrypt, keyedHash } from '../lib/crypto.js';
import { REJECT_REASONS, describeStatus } from '../lib/orders.js';
import { HttpError, handle, send } from '../lib/http.js';

export default handle('GET', async (req, res) => {
  const token = new URL(req.url, 'https://placeholder.invalid').searchParams.get('t');
  if (!token) throw new HttpError(400, 'This link is missing its claim token.');

  await ensureSchema();

  if (!(await underLimit('status', callerKey(req), 120, 3600))) {
    throw new HttpError(429, 'Too many lookups from here in the last hour. Try later.');
  }

  const order = await findByClaimTokenHash(keyedHash(token));
  if (!order) {
    throw new HttpError(
      404,
      'No order matches this link. Check you have the entire address, or recover it with your ' +
        'card code.',
    );
  }

  const status = describeStatus(order);

  const payload = {
    status,
    brand: order.card_brand,
    amount: order.card_amount_cents / 100,
    submitted: order.created_at,
    decided: order.decided_at,
  };

  if (status === 'rejected') {
    payload.reason = REJECT_REASONS[order.reject_reason] || 'The card did not check out.';
  }

  if (status === 'confirmed') {
    const number = process.env.INTAKE_PHONE_NUMBER;
    if (!number) {
      throw new HttpError(
        503,
        'This order is confirmed but no intake number is configured yet. Set ' +
          'INTAKE_PHONE_NUMBER in the project settings.',
      );
    }
    payload.phone = number;
    payload.accessCode = decrypt(order.access_code_encrypted);
  }

  if (status === 'used') {
    payload.usedAt = order.access_code_used_at;
  }

  send(res, 200, payload);
});
