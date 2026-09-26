// The paid gate. The intake agent calls this before anything else and ends the call on a
// refusal, which is what lets the phone number be worth nothing on its own.

import { ensureSchema, sql, underLimit } from '../lib/db.js';
import { callerKey, keyedHash, timingSafeEqual } from '../lib/crypto.js';
import { CODE_WINDOW_HOURS, MAX_CODE_USES } from '../lib/orders.js';
import { HttpError, handle, readJson, send } from '../lib/http.js';

const MAX_USES = MAX_CODE_USES;
const WINDOW_HOURS = CODE_WINDOW_HOURS;

export default handle('POST', async (req, res) => {
  const expected = process.env.INTAKE_VERIFY_SECRET;
  if (!expected) {
    throw new HttpError(
      503,
      'INTAKE_VERIFY_SECRET is not set, so access codes cannot be checked. Set it in the ' +
        'project settings and give the same value to the intake agent.',
    );
  }
  const offered = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!timingSafeEqual(offered, expected)) {
    throw new HttpError(401, 'This endpoint is for the intake agent.');
  }

  const body = await readJson(req);
  const code = String(body.accessCode || body.access_code || '').replace(/\D/g, '');
  if (code.length !== 6) {
    return send(res, 200, { ok: false, reason: 'not_six_digits' });
  }

  await ensureSchema();

  if (!(await underLimit('verify', callerKey(req), 60, 600))) {
    throw new HttpError(429, 'Too many code checks in the last ten minutes.');
  }

  const rows = await sql()`
    select id, access_code_uses, access_code_first_used_at
      from orders
     where access_code_hash = ${keyedHash(code)} and status = 'confirmed'
     limit 1
  `;
  const order = rows[0];
  if (!order) return send(res, 200, { ok: false, reason: 'no_such_code' });

  const first = order.access_code_first_used_at;
  const expired =
    first && Date.now() - new Date(first).getTime() > WINDOW_HOURS * 3_600_000;
  if (expired) return send(res, 200, { ok: false, reason: 'expired' });
  if (Number(order.access_code_uses) >= MAX_USES) {
    return send(res, 200, { ok: false, reason: 'already_used' });
  }

  await sql()`
    update orders set
      access_code_uses = access_code_uses + 1,
      access_code_first_used_at = coalesce(access_code_first_used_at, now()),
      access_code_used_at = now()
    where id = ${order.id}
  `;

  send(res, 200, { ok: true, remaining: MAX_USES - Number(order.access_code_uses) - 1 });
});
