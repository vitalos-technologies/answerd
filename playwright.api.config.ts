import { defineConfig, devices } from "@playwright/test"

// API mode: the prototype built with NEXT_PUBLIC_ANSWERD_API_URL (staging by default) and tested against it.
//   NEXT_PUBLIC_ANSWERD_API_URL=https://answerd-staging-api.onrender.com pnpm build
//   NEXT_PUBLIC_ANSWERD_API_URL=https://answerd-staging-api.onrender.com pnpm test:e2e:api
// Staging sleeps on Render's free tier, so global setup wakes it and timeouts are generous.
// The journeys sign in with real phone codes, so they only run when ANSWERD_STAGING_TEST_PHONES lists the
// allowlisted test numbers (JSON, e.g. {"customer":"+447700900123","owner":"+447700900456"}).

process.env.NEXT_PUBLIC_ANSWERD_API_URL ??= "https://answerd-staging-api.onrender.com"
const PORT = Number(process.env.E2E_PORT ?? 3301)
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`
const phones = process.env.ANSWERD_STAGING_TEST_PHONES

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/e2e-api/warm-up.ts",
  timeout: 300_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
    navigationTimeout: 120_000,
  },
  projects: [
    { name: "api-smoke", testMatch: "e2e-api/**/*.spec.ts" },
    // The spec's journeys in API mode: they use the README personas' numbers, which must be allowlisted on staging
    ...(phones ? [{ name: "api-journeys", testMatch: "e2e/j*.spec.ts" }] : []),
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: `pnpm start -p ${PORT}`, url: `${baseURL}/hub`, reuseExistingServer: true, timeout: 120_000 },
})
