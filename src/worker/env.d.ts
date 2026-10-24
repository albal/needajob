// Secrets aren't in wrangler.jsonc, so `wrangler types` can't see them.
interface Env {
  ADZUNA_APP_ID: string;
  ADZUNA_APP_KEY: string;
}

declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import("./index");
  }
}
