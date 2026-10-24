import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { cloudflareTest } from "@cloudflare/vitest-plugin";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "core",
          include: ["src/core/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        plugins: [react()],
        test: {
          name: "web",
          include: ["src/web/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["src/web/test-setup.ts"],
        },
      },
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: "./wrangler.jsonc" },
            miniflare: {
              bindings: { ADZUNA_APP_ID: "test-id", ADZUNA_APP_KEY: "test-key" },
            },
          }),
        ],
        test: {
          name: "worker",
          include: ["src/worker/**/*.test.ts"],
        },
      },
    ],
  },
});
