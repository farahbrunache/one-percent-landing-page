# Agent instructions — One Percent landing page and checkout

This repository is the public face of One Percent: the page it is sold from, the checkout,
the claim page a buyer keeps, and the screen the owner confirms payments on. It is deployed
to `farahbrunache.com` by Vercel.

One Percent is paid work and a separate product from Skills Economy, which is free and
self-service. Nothing here requires an account anywhere.

## One phone-width layout at every viewport

The same column at every screen size, centred on anything wider than a phone. Never a second
layout for desktop.

One thing to build, one thing to check, and every person sees what every other person sees.
Anything sized in viewport units breaks that — it is one size on a phone and another inside
the frame on a desktop — so size in fixed units.

Check a change by rendering at 390 pixels rather than assuming. Playwright with the
preinstalled Chromium does it; the horizontal overflow figure should always be zero.

## Never leave unused code

A change that strands something removes it in the same change: a column, an export, a CSS
rule, an endpoint, a setting, a page. Not a follow-up, not an issue, not a question for the
owner.

Search before deleting — readers, writers, the pages, the tests and the schema — and delete
the setting from the project's environment variables too, or it sits there looking required.

## The owner works from a phone and has no terminal

Never end a piece of work with a command for them to run. Anything they have to do must be
doable in a web dashboard. Everything configurable is an environment variable so it changes
without a deploy.

## Voice

No pleasantries, no first-person feeling words, no jargon. State the result and stop. The
full list is in `chargingthefuture/chargingthefuture` → `CLAUDE.md`, and it applies to page
copy, commit messages and pull request bodies alike.

Never quote the owner's messages in a commit message, a pull request body, or a file. Write
what changed in your own words.

## Branches, pull requests and checks

Descriptive branch off the trunk, surgical change, pull request opened ready for review with
the title and body set at creation.

Run `npm test` before pushing. It covers every request path that does not need a database.

Never watch a pull request. After opening one, do not subscribe to its activity and do not
wait for its checks. The harness subscribes on its own; unsubscribe straight away.

## What the money rules are

Every bill this pays is charged in cash, and a gift card cannot pay one — it only offsets
spending that would have happened anyway. Two payment routes exist for that reason: Wise
reaches a bank account, and the gift card is for somebody who has none.

A gift card code is money in bearer form. It is encrypted at rest and destroyed the moment a
decision is recorded. Nothing spendable survives in the database.

Nothing that identifies a person is collected at any point — no name, no email address, no
location. A lost claim link is recovered with the reference or the card code and nothing else.
