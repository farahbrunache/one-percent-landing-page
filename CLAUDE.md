# Agent instructions — One Percent landing page

The page One Percent is sold from, and nothing else. Static, no secrets, no database.
Deployed to `farahbrunache.com` by Vercel.

The checkout, the claim page and the payment screen live in a separate repository,
`one-percent-app`, on `app.farahbrunache.com`. That split is deliberate: a change to this
page must not redeploy the code that holds money. Anything about payments, orders or
sessions belongs there, not here.

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

## Dark only

One theme. No light theme, no `prefers-color-scheme` branch, no switch. A second theme is a
second thing to build, a second thing to check, and a second way for two people to look at
the same page and see different things.

Colours are tokens on `:root` and nothing is hard-coded in a rule. When rendering to check a
change, set the browser to dark — headless Chromium defaults to light and will show you a
page nobody sees.

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

Never watch a pull request. After opening one, do not subscribe to its activity and do not
wait for its checks. The harness subscribes on its own; unsubscribe straight away.
