import { reset } from "cloudflare:test";
import { afterEach, vi } from "vitest";

afterEach(async () => {
  vi.restoreAllMocks();
  await reset();
});
