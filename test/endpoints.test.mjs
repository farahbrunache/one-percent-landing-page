// Exercises every request path that does not need a database: method rejection, input
// validation, the bearer check on the paid gate, refusing an admin request with no cookie,
// and the shape of every error.
//
// Anything reaching a query is not covered here and is checked against a real database.
// Run with: npm test
import { Readable } from 'node:stream';

function makeReq(method, url, body, headers = {}) {
  const raw = body === undefined ? '' : JSON.stringify(body);
  const req = Readable.from(raw ? [raw] : []);
  req.method = method;
  req.url = url;
  req.headers = { 'content-type': 'application/json', ...headers };
  return req;
}

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    payload: null,
    writableEnded: false,
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(text) { this.payload = text ? JSON.parse(text) : null; this.writableEnded = true; },
  };
  return res;
}

async function run(handler, method, url, body, headers) {
  const res = makeRes();
  await handler(makeReq(method, url, body, headers), res);
  return res;
}

let failures = 0;
function check(label, condition, detail) {
  if (condition) { console.log('  ok   ' + label); }
  else { failures += 1; console.log('  FAIL ' + label + (detail ? ' -> ' + JSON.stringify(detail) : '')); }
}

const submit = (await import('../api/submit.js')).default;
const verify = (await import('../api/verify.js')).default;
const status = (await import('../api/status.js')).default;
const recover = (await import('../api/recover.js')).default;
const admin = (await import('../api/admin.js')).default;

console.log('submit');
let r = await run(submit, 'GET', '/api/submit');
check('rejects GET with 405', r.statusCode === 405, r.payload);
check('names the allowed method', r.headers.allow === 'POST', r.headers);

r = await run(submit, 'POST', '/api/submit', { brand: 'Nope', amount: 7, code: 'ABCDEFGH' });
check('rejects an unknown card brand', r.statusCode === 400, r.payload);

r = await run(submit, 'POST', '/api/submit', { brand: 'Amazon', amount: 7, code: 'short' });
check('rejects a code that is too short', r.statusCode === 400, r.payload);

r = await run(submit, 'POST', '/api/submit', { brand: 'Amazon', amount: 7, code: 'A'.repeat(70) });
check('rejects a code that is too long', r.statusCode === 400, r.payload);

r = await run(submit, 'POST', '/api/submit', { brand: 'Amazon', amount: 3, code: 'ABCD1234EFGH' });
check('rejects less than the price', r.statusCode === 400, r.payload);

r = await run(submit, 'POST', '/api/submit', { brand: 'Amazon', amount: 'banana', code: 'ABCD1234EFGH' });
check('rejects a non-numeric amount', r.statusCode === 400, r.payload);

r = await run(submit, 'POST', '/api/submit', { brand: 'Amazon', amount: 9999, code: 'ABCD1234EFGH' });
check('rejects an absurd amount', r.statusCode === 400, r.payload);

check('every rejection carries a message', typeof r.payload?.error === 'string' && r.payload.error.length > 20, r.payload);

console.log('verify (the paid gate)');
r = await run(verify, 'POST', '/api/verify', { accessCode: '123456' });
check('refuses without the bearer token', r.statusCode === 401, r.payload);

r = await run(verify, 'POST', '/api/verify', { accessCode: '123456' }, { authorization: 'Bearer wrong-secret-value' });
check('refuses a wrong bearer token', r.statusCode === 401, r.payload);

r = await run(verify, 'POST', '/api/verify', { accessCode: '12' }, { authorization: 'Bearer ' + process.env.INTAKE_VERIFY_SECRET });
check('answers ok:false on a short code without a lookup', r.statusCode === 200 && r.payload.ok === false && r.payload.reason === 'not_six_digits', r.payload);

r = await run(verify, 'POST', '/api/verify', { accessCode: 'abcdef' }, { authorization: 'Bearer ' + process.env.INTAKE_VERIFY_SECRET });
check('non-digits are not six digits', r.payload?.ok === false && r.payload.reason === 'not_six_digits', r.payload);

r = await run(verify, 'GET', '/api/verify');
check('rejects GET', r.statusCode === 405, r.payload);

console.log('status');
r = await run(status, 'GET', '/api/status');
check('rejects a link with no token', r.statusCode === 400, r.payload);
r = await run(status, 'POST', '/api/status?t=x');
check('rejects POST', r.statusCode === 405, r.payload);

console.log('recover');
r = await run(recover, 'POST', '/api/recover', { code: 'nope' });
check('rejects a code that is too short', r.statusCode === 400, r.payload);

console.log('admin');
r = await run(admin, 'GET', '/api/admin?action=list');
check('list refuses without a cookie', r.statusCode === 401, r.payload);
r = await run(admin, 'POST', '/api/admin?action=decide', { id: 1, decision: 'confirm' });
check('decide refuses without a cookie', r.statusCode === 401, r.payload);
r = await run(admin, 'POST', '/api/admin?action=nonsense', {});
check('an unknown action is refused', r.statusCode === 400, r.payload);
r = await run(admin, 'DELETE', '/api/admin');
check('rejects an unsupported method', r.statusCode === 405, r.payload);

console.log('');
if (failures) { console.log(failures + ' FAILED'); process.exit(1); }
console.log('all passed');
