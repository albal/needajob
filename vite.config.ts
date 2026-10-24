import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** Adds the cookieless Cloudflare Web Analytics beacon when a token is configured. */
function webAnalytics(token: string | undefined): Plugin {
  return {
    name: "cloudflare-web-analytics",
    transformIndexHtml() {
      if (!token) return [];
      return [
        {
          tag: "script",
          attrs: {
            defer: true,
            src: "https://static.cloudflareinsights.com/beacon.min.js",
            "data-cf-beacon": JSON.stringify({ token }),
          },
          injectTo: "body",
        },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env };
  return {
    plugins: [react(), webAnalytics(env.VITE_CF_BEACON_TOKEN)],
    server: {
      proxy: { "/api": "http://localhost:8787" },
    },
  };
});
