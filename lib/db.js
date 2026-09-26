// Database access for the checkout. One table for orders, one for rate limiting.
//
// Nothing here stores a name, an address, a phone number or anything else that identifies a
// person. An order is a gift card and a claim token, and that is all it ever is.

import { neon } from '@neondatabase/serverless';
import { keyedHash } from './crypto.js';

let cachedSql = null;

export function sql() {
  if (!cachedSql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Add a Neon database to this Vercel project, which sets the ' +
          'variable for you, or paste a connection string into the project settings.',
      );
    }
    cachedSql = neon(url);
  }
  return cachedSql;
}

// Called by every endpoint before its first query. Creating the tables on demand means there
// is no migration step for somebody working from a phone to run.
let ready = false;
export async function ensureSchema() {
  if (ready) return;
  const q = sql();
  await q`
    create table if not exists orders (
      id                    bigserial primary key,
      claim_token_hash      text        not null unique,
      card_code_hash        text        not null,
      card_brand            text        not null,
      card_amount_cents     integer     not null,
      card_code_encrypted   text,
      status                text        not null default 'pending',
      reject_reason         text,
      access_code_hash      text,
      access_code_encrypted text,
      access_code_used_at   timestamptz,
      created_at            timestamptz not null default now(),
      decided_at            timestamptz
    )
  `;
  // Added when payment stopped being gift cards only. Zelle and Wise carry no code, so the
  // reference is what the sender puts in the note and what the owner matches against.
  await q`alter table if exists orders add column if not exists payment_method text`;
  await q`alter table if exists orders add column if not exists reference_code text`;
  await q`alter table if exists orders alter column card_code_hash drop not null`;
  await q`alter table if exists orders alter column card_brand drop not null`;
  await q`create unique index if not exists orders_reference_code_idx on orders (reference_code)`;

  // A dropped call must not burn a paid code, so a confirmed
  // code answers a small number of times inside a short window rather than exactly once.
  await q`alter table if exists orders add column if not exists access_code_uses integer not null default 0`;
  await q`alter table if exists orders add column if not exists access_code_first_used_at timestamptz`;
  await q`create index if not exists orders_status_idx on orders (status, created_at desc)`;
  await q`create unique index if not exists orders_card_code_hash_idx on orders (card_code_hash)`;
  await q`create index if not exists orders_access_code_hash_idx on orders (access_code_hash)`;
  await q`
    create table if not exists rate_limits (
      bucket       text        primary key,
      hits         integer     not null default 0,
      window_start timestamptz not null default now()
    )
  `;
  ready = true;
}

// A fixed-window counter. Coarse on purpose: it is here to stop a script, not to be fair.
// Returns true when the request is allowed.
export async function underLimit(name, callerHash, max, windowSeconds) {
  const q = sql();
  const bucket = keyedHash(`${name}:${callerHash}`);
  const rows = await q`
    insert into rate_limits (bucket, hits, window_start)
    values (${bucket}, 1, now())
    on conflict (bucket) do update set
      hits = case
        when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        then 1
        else rate_limits.hits + 1
      end,
      window_start = case
        when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        then now()
        else rate_limits.window_start
      end
    returning hits
  `;
  return Number(rows[0]?.hits ?? 0) <= max;
}

export async function findByClaimTokenHash(hash) {
  const rows = await sql()`
    select id, card_brand, card_amount_cents, payment_method, reference_code, status,
           reject_reason,
           access_code_encrypted, access_code_used_at, access_code_uses,
           access_code_first_used_at, created_at, decided_at
      from orders
     where claim_token_hash = ${hash}
     limit 1
  `;
  return rows[0] || null;
}
