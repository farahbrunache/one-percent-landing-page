// What a session costs, and how somebody can pay for it.

export const SESSION_PRICE_CENTS = 700;

// Three routes, chosen to cover everybody without a fourth vendor to reconcile.
//
// Zelle and Wise deliver actual money to a bank account, which matters because every bill
// this pays is charged in cash. The gift card is for somebody with no bank account at all —
// it can be bought over a counter with cash, so the route in stays open for them.
export const PAYMENT_METHODS = {
  zelle: {
    label: 'Zelle',
    who: 'United States',
    needsCode: false,
    envKey: 'PAY_ZELLE',
  },
  wise: {
    label: 'Wise',
    who: 'Anywhere outside the United States',
    needsCode: false,
    envKey: 'PAY_WISE',
  },
  amazon: {
    label: 'Amazon gift card',
    who: 'No bank account — a card can be bought with cash in a shop',
    needsCode: true,
    envKey: null,
  },
};

export function isPaymentMethod(value) {
  return Object.prototype.hasOwnProperty.call(PAYMENT_METHODS, value);
}

// Said out loud in a Zelle or Wise note, and typed back to recover a lost link. Digits and
// letters that cannot be mistaken for each other: no O, 0, I, 1, S or 5.
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789';

export function referenceCode(random) {
  let out = '';
  for (let i = 0; i < 6; i += 1) out += REFERENCE_ALPHABET[random(REFERENCE_ALPHABET.length)];
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}

export function normalizeReference(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^(.{3})(.{3})$/, '$1-$2');
}

export const REJECT_REASONS = {
  not_received: 'Nothing arrived under that reference.',
  short: 'Less than seven dollars arrived.',
  empty: 'The gift card had no balance on it.',
  used: 'The gift card had already been redeemed.',
  invalid: 'The gift card code did not work. It may have been mistyped.',
  duplicate: 'That payment had already been submitted here.',
};

// A dropped call must not burn a paid code, so a confirmed code answers a few times inside a
// short window. Past either limit it stops working and the claim page says so.
export const MAX_CODE_USES = 3;
export const CODE_WINDOW_HOURS = 24;

export function describeStatus(order) {
  if (!order) return 'unknown';
  if (order.status !== 'confirmed') return order.status;
  const first = order.access_code_first_used_at;
  const expired = first && Date.now() - new Date(first).getTime() > CODE_WINDOW_HOURS * 3_600_000;
  if (expired || Number(order.access_code_uses || 0) >= MAX_CODE_USES) return 'used';
  return 'confirmed';
}
