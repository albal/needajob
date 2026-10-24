# One Worker serves both the frontend and the API

The PRD proposed Cloudflare Pages for the frontend plus a separate Worker as an Adzuna proxy, with strict CORS between them. We instead deploy a single Cloudflare Worker that serves the static frontend assets and the `/api/*` routes from the same origin. Cloudflare now steers new projects to Workers static assets rather than Pages, and same-origin removes the CORS configuration entirely while still keeping the Adzuna `app_id`/`app_key` server-side.
