# needajob

Entry-level tech jobs only. See [PRD.md](PRD.md), [GLOSSARY.md](GLOSSARY.md) and [docs/adr/](docs/adr/).

## Development

```sh
npm install
cp .dev.vars.example .dev.vars   # add Adzuna credentials
npm run build                    # build the SPA into dist/ (served by the Worker)
npm run dev                      # wrangler dev on :8787 + vite on :5173 (proxies /api)
npm test                         # core, web and worker test projects
npm run typecheck
```

Trigger a Harvest locally with `curl "http://localhost:8787/__scheduled?cron=0+*/6+*+*+*"` while `wrangler dev --test-scheduled` is running.

## Deploy

GitHub Actions (`.github/workflows/ci.yml`) typechecks, tests and builds every push and PR. Pushes to `main` then run `wrangler deploy`, provided these are configured on the repo:

- Secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Without them the deploy is skipped.
- Variable `CF_BEACON_TOKEN` (optional): the Cloudflare Web Analytics token. The beacon is cookieless.

The Adzuna credentials are Worker secrets: `npx wrangler secret put ADZUNA_APP_ID` and `npx wrangler secret put ADZUNA_APP_KEY`.
