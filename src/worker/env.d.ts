// Secrets aren't in wrangler.jsonc, so `wrangler types` can't see them.
interface Secrets {
  ADZUNA_APP_ID: string;
  ADZUNA_APP_KEY: string;
}

interface Env extends Secrets {}

declare namespace Cloudflare {
  interface Env extends Secrets {}
  interface GlobalProps {
    mainModule: typeof import("./index");
  }
}
