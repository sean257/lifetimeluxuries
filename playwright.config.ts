import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    // Uses the installed Google Chrome; run `pnpm exec playwright install chromium` if you don't have it.
    channel: process.env.E2E_CHANNEL ?? "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], channel: process.env.E2E_CHANNEL ?? "chrome" } },
    { name: "desktop", use: { viewport: { width: 1280, height: 860 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `pnpm start -p ${PORT}`, url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
