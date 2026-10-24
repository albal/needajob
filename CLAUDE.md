## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on `albal/needajob`, using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Project layout

- `src/core/`: pure domain logic shared by the Worker and the SPA (tested in the `core` Vitest project).
- `src/worker/`: the Cloudflare Worker, i.e. the Hono API and the Harvest (tested in the `worker` project, which runs in workerd).
- `src/web/`: the React SPA (tested in the `web` project with jsdom).
- Run `npm test` and `npm run typecheck` before committing. After changing `wrangler.jsonc`, rerun `npm run cf-typegen`.
