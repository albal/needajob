# Product Requirements Document: needajob

Terms in **bold** are defined in [GLOSSARY.md](GLOSSARY.md). Key decisions are recorded in [docs/adr/](docs/adr/).

## 1. Product Overview

**Product name:** needajob
**Description:** A fast job search site that shows only **Entry-Level Jobs** in tech, so juniors don't have to filter out mid-level and senior listings.
**Platform:** Mobile-first responsive web app
**Data source:** Adzuna Job Search API (free tier)
**Hosting:** Cloudflare free tier, as a single Cloudflare Worker

## 2. Goals

* **User goal:** Find entry-level tech jobs without sifting through senior and mid-level roles.
* **Technical goal:** Run at zero cost within the Cloudflare and Adzuna free tiers.

## 3. Target Audience

Recent graduates, bootcamp alumni, apprentices and self-taught developers looking for their first or second tech job.

## 4. Scope & Core Features (MVP)

### 4.1. Entry-Level Jobs

A **Job** is an **Entry-Level Job** when its title contains at least one **Entry-Level Marker** and no **Seniority Marker**. Only the title is used, not the description. We accept missing some Jobs in exchange for precise results.

* **Entry-Level Markers:** Junior, Graduate, Entry Level, Trainee, Apprentice, Intern/Internship, Placement, plus local-language equivalents (e.g. Berufseinsteiger, Werkstudent, Débutant, Stagiaire, Alternance). "Associate" is deliberately excluded.
* **Seniority Markers:** Senior, Lead, Principal, Staff, Head, Manager, Director, Architect, II, III, plus local-language equivalents. A Seniority Marker disqualifies a Job even when an Entry-Level Marker is also present (e.g. "Senior Engineer – Graduate Scheme Mentor").
* English Markers apply in every **Country**, because tech adverts are often written in English. Local-language lists are added for de, fr, es, it, nl, pl and pt. They start rough and are refined over time.

### 4.2. Disciplines

The user can narrow a **Search** to one or more **Disciplines**. A Job matches a Discipline when its title contains one of that Discipline's **Discipline Terms** (in any supported language). A Job can match several Disciplines. A Search with several Disciplines returns Jobs that match **any** of them. Selecting none means all Disciplines.

Supported Disciplines:

* Software Engineer
* Backend Engineer
* Frontend Engineer
* Full Stack Engineer
* UI Developer
* Tech Project Manager
* Systems Engineer
* Cloud Engineer
* DevOps Engineer
* Platform Engineer
* SRE

### 4.3. Country & Location

* **Country:** All 19 Countries Adzuna supports (gb, us, at, au, be, br, ca, ch, de, es, fr, in, it, mx, nl, nz, pl, sg, za). The default is the visitor's country, detected by Cloudflare, when Adzuna supports it, and GB otherwise. The last Country chosen is remembered on the device.
* **Location:** An optional dropdown offering two levels from Adzuna's location hierarchy: regions, and counties/states within them. Only places that have at least one Job in the current **Job Pool** are listed. Choosing a region includes all its counties. Leaving it empty searches the whole Country. Towns and cities are not offered.

### 4.4. Results

* **Order:** Newest first.
* **Pagination:** 20 Jobs per page with Next/Previous buttons and a total count (e.g. "143 entry-level jobs").
* **Job cards** show:
  * title, company, Location and posting age ("Posted 3 days ago")
  * the description snippet and the Disciplines the Job matched
  * the **Stated Salary**, if the advert gives one. Adzuna's predicted salaries are never shown.
  * an **Apply** link via the Job's Adzuna `redirect_url`
  * the Adzuna attribution label (see §6)
  * a Save button
* **Freshness:** The UI shows when the Job Pool was last updated (e.g. "Jobs updated 2 hours ago").
* **Shareable state:** The Search is encoded in the URL (e.g. `/?country=gb&location=Hampshire&discipline=devops&discipline=sre&page=2`).

### 4.5. Saved Jobs

* Users can save Jobs. A **Saved Job** is a copy of the Job as it was when saved, plus the time it was saved (e.g. "Saved 12 days ago"). Adzuna has no fetch-by-id endpoint, so a copy is needed.
* Saved Jobs are kept in browser storage on the user's device and are not synced.
* There is no check for whether a saved advert is still live. Old links may stop working.

## 5. Technical Architecture

### 5.1. Single Worker ([ADR 0001](docs/adr/0001-single-worker-serves-frontend-and-api.md))

One Cloudflare Worker serves both the static frontend assets and the `/api/*` routes from the same origin. There is no Cloudflare Pages project and no CORS configuration.

* **Frontend:** React + TypeScript, built with Vite, served as a static single-page app from Worker static assets. No server-side rendering.
* **API:** Hono routes on the same Worker, sharing TypeScript types (e.g. Job) with the frontend.
* **Secrets:** The Adzuna `app_id` and `app_key` are Worker secrets (`wrangler secret put`). They never appear in the repo or the client bundle.

### 5.2. Job Pool & Harvest ([ADR 0002](docs/adr/0002-searches-served-from-a-harvested-job-pool.md))

Adzuna's free tier allows 250 calls a day and 2,500 a month, and the key is shared with jobscout (about 24 calls a day). That is far too few to proxy Searches live across all combinations of Country, Location and Disciplines, so Searches never call Adzuna. Instead:

* **Harvest:** A Cron Trigger runs hourly and Harvests a twelfth of the Countries each run, so each Country is Harvested every 12 hours. For each Country it calls Adzuna `/v1/api/jobs/{country}/search/{page}` with:
  * `category=it-jobs`
  * `what_or` = single-word Entry-Level Markers
  * `sort_by=date`
  * `results_per_page=50`

  Page budget: 2 pages each for gb and us, and 1 page for every other Country. That is 21 calls per 12 hours (at most 3 per hourly run), about 42 a day and about 1,300 a month. With jobscout's share the key stays around 2,050 a month, under the 2,500 limit.
* **Filtering at Harvest time:** Results go through the Entry-Level Job title rules. Each Job is tagged with the Disciplines it matches.
* **Merging:** New Jobs are merged into the Country's Job Pool by Adzuna id. Jobs older than 30 days are dropped.
* **Storage:** One compact Workers KV value per Country, holding only the fields cards need, with the description trimmed to about 200 characters. If a large Country's Pool brings Search close to the free tier's 10ms CPU limit, the Pool is split by region rather than moved to D1.
* **Failure handling:** If a Harvest fails (Adzuna errors, 429s or quota exhausted), the previous Job Pool stays as it is and the next scheduled run tries again. Failures are logged, with no alerting in the MVP.
* **Search:** `/api/jobs` reads the Country's Job Pool from KV, then filters by Location and Disciplines, sorts and paginates in memory. It also returns the Location options and the Pool's last-updated time.
* **Coverage trade-offs we accept:** Results can be up to 12 hours old. High-volume Countries may be only partly harvested. Tech Project Manager and UI Developer Jobs outside Adzuna's `it-jobs` category are missed.

Adzuna's `what` parameter has no boolean OR. All precision therefore comes from our own title rules, not from query construction.

### 5.3. Word Lists

Entry-Level Markers, Seniority Markers and Discipline Terms for all languages live in a single typed config module in the repo. Changing them is a code change and a redeploy. There is no admin UI.

### 5.4. Free-Tier Budgets

| Resource | Limit | Expected use |
| --- | --- | --- |
| Adzuna API | 250 calls/day, 2,500/month, shared with jobscout | ~42/day, ~1,300/month |
| Worker subrequests | 50 per invocation | ≤3 per hourly Harvest |
| Workers KV writes | 1,000/day | 38/day (19 Countries × 2 Harvests) |
| Workers KV reads | 100,000/day | 1 per Search |
| Worker requests | 100,000/day | Ample for MVP |
| Worker CPU | 10 ms per invocation | Keep Job Pools compact |

## 6. Adzuna Terms ([ADR 0003](docs/adr/0003-adzuna-terms-constrain-the-product.md))

* needajob is **non-commercial**: no ads, paid features or lead generation. Any move to make money needs an Adzuna licence first.
* Every displayed Job carries an "Adzuna" label at least 116×23px, linked to Adzuna's site for that Country.
* Apply links must use the Job's `redirect_url`.
* Predicted salaries are never shown. This avoids the "Adzuna Jobsworth" attribution requirement.
* Click-through statistics are not disclosed.
* If the Adzuna key is revoked, all harvested data must be deleted.

## 7. User Flow

1. **Landing:** The user arrives. Country defaults to their location (or GB).
2. **Search:** The user optionally picks a Location and one or more Disciplines.
3. **Results:** The frontend calls `/api/jobs?country=gb&location=Hampshire&discipline=devops`. The Worker answers from the Job Pool and the URL updates to match.
4. **Browse:** The user pages through Job cards, newest first.
5. **Act:** The user saves a Job, or clicks Apply and goes to the advert via Adzuna's `redirect_url`.

## 8. Non-Functional Requirements

* **Performance:** LCP under 2s on a mid-range phone over 4G. `/api/jobs` responds in under 200ms at the edge.
* **Responsive design:** Fully usable on mobile, since junior candidates often browse on their phones.
* **Security:** Adzuna credentials exist only as Worker secrets.
* **Privacy & analytics:** Cloudflare Web Analytics, which is cookieless, so no cookie banner is needed. A short privacy note explains that Saved Jobs stay on the user's device.

## 9. Quality & Delivery

* **Unit tests (Vitest):** Title rules, tested against realistic titles (e.g. "Senior Graduate Scheme Mentor" is rejected and "Werkstudent DevOps" accepted), and the filtering and pagination logic.
* **Integration tests:** `@cloudflare/vitest-pool-workers` with Adzuna and KV stubbed. Tests never use Adzuna quota.
* **Deploy:** GitHub Actions runs the tests, then `wrangler deploy` on every push to `main`. The site uses the `*.workers.dev` subdomain until a custom domain is chosen.

## 10. Out of Scope (Post-MVP)

* **Email alerts:** daily Job alerts via a free email tier.
* **Accounts:** Cloudflare D1 for user accounts and Saved Jobs across devices.
* **Resume keyword matcher:** highlighting keywords missing from a Job description.
* **Coverage improvements:** harvesting categories beyond `it-jobs`, and refining the word lists for each language.

## 11. Open Items to Verify With a Real Adzuna Key

* The `results_per_page` maximum (assumed 50).
* How `what_or` combines with `category`, and whether `sort_by=date` behaves as expected.
* Whether `redirect_url`s for expired adverts still resolve.
