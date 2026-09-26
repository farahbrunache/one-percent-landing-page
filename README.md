# One Percent — landing page and checkout

A static page at `farahbrunache.com`, plus a gift-card checkout that runs as Vercel functions
against a small Postgres database.

One Percent is paid work and it is a separate product from Skills Economy, which is free and
self-service. Nothing here requires an account anywhere.

## What it does

1. Somebody reads `/` and decides to pay.
2. `/buy` asks only how they are paying: Zelle in the United States, Wise anywhere else, or an
   Amazon gift card for somebody with no bank account. No name, no email address, no phone
   number, no location.
3. They get a claim link and a six-character reference. A transfer goes to the address shown
   with that reference in the note; a gift card carries its code instead. The link is their
   only record, and nothing else stored could find their order.
4. You see it on `/admin` — the reference to match in Zelle or Wise, or the card code to
   redeem — then confirm or reject.
5. Confirming destroys the stored card code, where there was one, and issues a six-digit
   access code.
6. Their claim link now shows the intake phone number and that access code.
7. The intake agent calls `/api/verify` before anything else and ends the call on a refusal.

The access code is what makes this hold. The phone number can leak and it costs nothing,
because a call without a valid unused code goes nowhere. Secrecy is not the defense.

## Setting it up

Everything below is done in a web dashboard. There is no command to run.

### 1. A database

In the Vercel project, open Storage and add a Postgres database. Vercel sets `DATABASE_URL`
for you. The tables are created on the first request, so there is no migration step.

### 2. Four settings

In the Vercel project, under Settings and then Environment Variables:

| Name | What it is |
|---|---|
| `CARD_ENCRYPTION_KEY` | A long random string, 32 characters or more. Generate it in a password manager. Everything secret in the database is encrypted or keyed under it. |
| `ADMIN_SECRET` | A long random string, 16 characters or more. What you type to sign in at `/admin`. Make it different from the one above. |
| `INTAKE_PHONE_NUMBER` | The number people call, exactly as it should be dialed. |
| `INTAKE_VERIFY_SECRET` | A long random string. The intake agent sends it back as a bearer token when it checks an access code. |
| `RETELL_API_KEY` | From the API Keys tab in the Retell dashboard. Used server-side only; it never reaches the browser. |
| `RETELL_AGENT_ID` | The agent that runs the session. |
| `PAY_ZELLE` | Where a Zelle payment goes, exactly as somebody should type it — the phone number or email address registered to your Zelle. Shown on the page. |
| `PAY_WISE` | Where a Wise payment goes, exactly as somebody should type it. Shown on the page. |

Either payment setting being missing does not break the site — that route refuses with a
plain message naming the setting, and the others keep working. So you can turn one on before
the other.

Do not put any of these in a message, a commit, or a file in this repository.

Changing `CARD_ENCRYPTION_KEY` makes every card code and access code already in the database
unreadable. Set it once, before anybody pays.

### 3. How a session starts

The claim page shows a button, not a phone number. The browser asks `/api/call` with the
claim token, the server checks the order is confirmed and not spent, asks Retell for a web
call, and hands the browser a one-time access token. Nothing is dialed and no code is spoken.

That makes the gate structural: a web call cannot be reached except through a link somebody
paid for. The six-digit access code stays in the database and on the page as a fallback for
anybody whose browser will not give up its microphone, and the agent's code check still
works for them.

The reference travels with the call as metadata, so a transcript can be matched back to the
payment it was bought with.

### 4. The phone fallback, if you keep one

Give the agent one step before its first question: ask for the six-digit access code and POST
it to `https://farahbrunache.com/api/verify`.

```
POST /api/verify
Authorization: Bearer <INTAKE_VERIFY_SECRET>
{ "accessCode": "123456" }
```

It answers `{ "ok": true }` or `{ "ok": false, "reason": "..." }`, where the reason is one of
`not_six_digits`, `no_such_code`, `already_used` or `expired`. On anything but `ok`, the agent
says the code did not work and ends the call.

## Rules built into the code

A gift card code is money in bearer form, so it is encrypted at rest and destroyed the moment
a decision is recorded. Nothing spendable survives.

A lost claim link is recovered with the reference or the gift card code — whichever the
person is holding, typed into the same box. Only a keyed hash of a card code is kept, so the
database alone cannot produce one.

An access code answers up to three times inside twenty-four hours of its first use. A dropped
line is redialed; a code passed around does not become a week of sessions.

No personal information is collected at any point. Requests are rate limited against a keyed
hash of the caller's address rather than the address itself.

## Files

| Path | What it is |
|---|---|
| `index.html` | The page the product is sold from |
| `buy.html` | The gift card form and the lost-link recovery |
| `claim.html` | Order status, and where the number and access code appear |
| `admin.html` | The one screen with manual work on it |
| `style.css` | Shared across every page |
| `api/submit.js` | Takes a card, returns a claim link |
| `api/status.js` | What a claim link shows |
| `api/recover.js` | Issues a new claim link against a card code |
| `api/verify.js` | The paid gate the intake agent calls |
| `api/admin.js` | Sign in, list what is waiting, confirm or reject |
| `lib/crypto.js` | Encryption, keyed hashing, token and code generation |
| `lib/db.js` | Schema, queries, rate limiting |
| `lib/orders.js` | Price, accepted card types, rejection reasons, code reuse rules |
| `lib/http.js` | Request and response helpers |

## Still to build

The customer service assistant. It reads order status and answers the questions that would
otherwise reach a person — what this is, where a card got to, why one was rejected, why there
are no refunds — and it absorbs anybody here to waste time. It gets no tool that can issue an
access code, confirm a card, or reveal the phone number, so the worst it can do is say
something wrong.
