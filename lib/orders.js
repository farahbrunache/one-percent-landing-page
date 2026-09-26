// What a session costs, and what the checkout accepts.

export const SESSION_PRICE_CENTS = 700;

export const CARD_BRANDS = ['Amazon', 'Apple', 'Google Play', 'Visa', 'Mastercard', 'Other'];

export const REJECT_REASONS = {
  empty: 'The card had no balance on it when it was checked.',
  used: 'The card had already been redeemed.',
  short: 'The card was worth less than seven dollars.',
  invalid: 'The code did not work. It may have been mistyped.',
  duplicate: 'That code had already been submitted here.',
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
