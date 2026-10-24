import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.E2E_PORT ?? 3300)
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`

/** End-to-end journeys (J1 to J8) and the route crawl. Run `pnpm build` first; the config starts `next start`. */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: process.env.BASE_URL
    ? undefined
    : { command: `pnpm start -p ${PORT}`, url: `${baseURL}/hub`, reuseExistingServer: true, timeout: 120_000 },
})
