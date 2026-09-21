# nuxtstoryblokgenerate

**Finished spike. Superseded — do not build on this.**

A standalone Nuxt 3 lab from October 2023, used to work out two things for the real
site: getting `nuxt generate` to prerender every Storyblok story, and getting the
Storyblok preview bridge to work. The branch it was done on was literally called
`simonk/make-generate-and-preview-work`.

It worked, and the result was moved into the production repo —
[`Mesterlaere/mesterlaere-app`](https://github.com/Mesterlaere/mesterlaere-app),
directory `webapp`, where `nuxt.config.ts` carries the same `nitro:config` hook, the
same `GENERATE_CONCURRENCY` cap and a proper `build-utils/generate/fetchStories`
module. This repo has had no commits since.

**This is not the site behind www.mesterlaere.dk.** All three branches (`Develop`,
`Staging`, `Production`) hold the same ~18 files and four dependencies. The live site
also runs Firebase, Sentry, Mixpanel, Nuxt UI Pro, Tailwind and i18n, none of which
are here.

## What it does

`nuxt.config.ts` hooks `nitro:config` and, on every non-dev build, walks the Storyblok
Content Delivery API (`/v2/cdn/stories`, 60 per page) to collect every story slug, then
pushes them into `nitro.prerender.routes`. `crawlLinks` is off, so that list *is* the
site. The `GlobalSettingsInternational` component is skipped, as are slugs starting
with `archive/` or `undefined`. Prerender concurrency is capped at 30 requests/second
because Storyblok rate-limits at 50; set `GENERATE_CONCURRENCY=1` for readable errors.

`vercelscript.sh` is Vercel's ignored-build-step gate, building only on `Develop`,
`Staging`, `Production` and `preview*`. Its exit codes look inverted — `exit 1` means
proceed, `exit 0` means cancel — which is Vercel's convention, not a bug.

Environment: `STORYBLOK_TOKEN` (space `164309`), `STORYBLOK_VERSION` (`draft` or
`published`), `ENVIRONMENT` (anything but `production` enables the bridge and
devtools), `GENERATE_CONCURRENCY`.

## If you do run it

```bash
yarn install    # yarn.lock is what is committed; another manager re-resolves the
yarn dev        # ^ ranges and gives you a different tree — bun install today
yarn generate   # yields nuxt 3.21.11 against a locked 3.7.4
```

`localhost-key.pem` and `localhost.pem` are committed dev certs for `yarn devsec`.
They predate the `.pem` line in `.gitignore`. Only valid for localhost, so hygiene
rather than an incident — but do not copy that pattern forward.
