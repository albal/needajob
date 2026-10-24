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
