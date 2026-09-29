# Agent instructions — One Percent landing page

The page One Percent is sold from, and nothing else. Static, no secrets, no database.
Deployed to `farahbrunache.com` by Vercel.

The checkout, the claim page and the payment screen live in a separate repository,
`one-percent-app`, on `app.farahbrunache.com`. That split is deliberate: a change to this
page must not redeploy the code that holds money. Anything about payments, orders or
sessions belongs there, not here.

One Percent is paid work and a separate product from Skills Economy, which is free and
self-service. Nothing here requires an account anywhere.

## There is nothing to build

Six files, all static, no package manager and no build step. `vercel.json` says so outright
— no framework, no install command, no build command, served from the repository root.

It says so because the hosting project was set up when this repository also held the
checkout, which had a package manager and needed one. After the split those settings were
still trying to build a site that has nothing to build, and every deployment failed.

Never add a build step here. If this page ever needs one, it has stopped being a page.

## One layout at every viewport, and it uses the width it is given

The same column at every screen size. Never a second layout for desktop: one thing to build,
one thing to check, and every person sees what every other person sees. That part does not
change and is the reason there are no breakpoints here.

What did change is the width. The column was held at phone width and framed, so a desktop
visitor got a narrow slot with the page going on around it. It now grows to a readable line
length and stops. There is no second design underneath — only a width that runs out.

The phone-width frame belongs to the app, on `app.farahbrunache.com`, where the screens are
built around one. It was copied here and it was never right here.

Sizing in viewport units is fine now. It was ruled out because a `vw` value meant one size on
a phone and another inside the frame on a desktop; with no frame it measures the window in
both places. Bound every one with `clamp()` so it has a floor and a ceiling.

Check a change by rendering rather than assuming, at 390 pixels and again at 1440. Playwright
with the preinstalled Chromium does it; the horizontal overflow figure should be zero at both.

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

No pleasantries, no first-person feeling words, no jargon. State the result and stop. It
applies to page copy, commit messages and pull request bodies alike.

The rule and its banned-term list come from `chargingthefuture/agents`, the baseline every
repository here starts from. They are settled there and are not re-argued per repository.

`.claude/hooks/check-no-pleasantries.mjs` in this repository enforces them and is the source
of truth when the two disagree. It is a copy, so a change to the baseline is copied across
rather than inherited automatically — change both or they drift.

Never quote the owner's messages in a commit message, a pull request body, or a file. Write
what changed in your own words.

## Never open an issue here

This repository's issues live in the private `one-percent` repository, along with the
checkout's and that repository's own. Open one there, and link to it from here if a pull
request needs to reference it.

You cannot tell in advance which issue turns out to carry something private, and this page
is where people arrive before paying — a report about it can easily carry somebody's
details. This repository is public and a published issue cannot be unsaid.

The page and its history stay public, and every pull request describes its change in the
open. That is what being open source promises here. An issue queue is not part of it.

## Branches, pull requests and checks

Descriptive branch off the trunk, surgical change, pull request opened ready for review with
the title and body set at creation.

Never watch a pull request. After opening one, do not subscribe to its activity and do not
wait for its checks. The harness subscribes on its own; unsubscribe straight away.

**Auto-merge goes on every pull request, without exception** (owner decision, 2026-09-29).
Turn it on as soon as the pull request is open, squash, and it completes itself.

A change to the price, to what somebody gets for it, to what happens after they pay, or to
the refund line used to wait for a person to read it. That is gone. The owner runs several
repositories and reading every change by hand across all of them is more work than one
person has, and a pull request sitting in a queue is not somebody checking it — it is a
page that says the wrong thing for longer.

The risk here is not technical: there is no database, no secret and no code that runs for
anybody. What can go wrong is what the page claims. So the care goes into writing the claim
rather than into waiting afterwards.

Before opening anything that changes a claim, check it against what the product actually
does — the app's own screens, the method, the agent script — rather than against what the
page used to say. A page that contradicts the product is the failure this is guarding
against, and it is found by looking, not by queueing.
