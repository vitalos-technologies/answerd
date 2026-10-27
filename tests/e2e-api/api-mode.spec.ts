import { expect, test } from "@playwright/test"
import { app, start, watchErrors } from "../e2e/helpers"
import { parsePhones } from "./phones"

// API mode against staging (playwright.api.config.ts). Checks the main customer path reads the API, not the
// mock store, and that sign-in uses the real phone-code flow when allowlisted test numbers are configured.

const API = process.env.NEXT_PUBLIC_ANSWERD_API_URL!
const phones = parsePhones(process.env.ANSWERD_STAGING_TEST_PHONES)
const OTP = process.env.ANSWERD_STAGING_OTP ?? "123456"

/** "+447700900123" → "07700 900123" */
const national = (e164: string) => {
  const d = e164.replace(/^\+44/, "0")
  return `${d.slice(0, 5)} ${d.slice(5)}`
}

async function apiJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(90_000) })
  expect(res.ok, `${path} → ${res.status}`).toBe(true)
  return (await res.json()) as T
}

test("the hub shows API mode and the catalogue comes from the API", async ({ page }) => {
  const errors = watchErrors(page)
  await start(page)
  await expect(page.getByTestId("data-source")).toHaveAttribute("data-mode", "api")
  await expect(page.getByTestId("data-source")).toContainText(new URL(API).host)
  await expect(page.getByTestId("api-sync")).toContainText(/\d+ listings from the API/)
  errors.assertNone()
})

test("search and listing show the API's data, with every mock listing it doesn't have hidden", async ({ page }) => {
  const errors = watchErrors(page)
  const F = app(page)
  await start(page)
  const swift = await apiJson<{ id: string; name: string; reviewSummary: { average: number; count: number } }>("/v1/listings/swift-plumbing-heating")
  const reviews = await apiJson<{ items: { authorName: string; body: string }[] }>(`/v1/listings/${swift.id}/reviews`)

  await page.goto("/app/search")
  await F.getByPlaceholder("What service do you need?").fill("boiler")
  await page.keyboard.press("Enter")
  await F.getByRole("link", { name: new RegExp(swift.name.replace(/[&]/g, "\\&")) }).first().click()
  await expect(page).toHaveURL(/\/app\/b\/swift-plumbing-heating$/)
  // The rating and count are the API's summary, not the mock reviews
  await expect(F.getByRole("link", { name: `Rated ${swift.reviewSummary.average.toFixed(1)} out of 5 from ${swift.reviewSummary.count} reviews` })).toBeVisible()
  await page.goto("/app/b/swift-plumbing-heating/reviews")
  await expect(F.getByText(reviews.items[0]!.body).first()).toBeVisible()

  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("answerd-demo-v1") ?? "{}").state as { listings: { slug: string; unpublished?: boolean; apiRating?: unknown }[] })
  const visible = st.listings.filter((l) => !l.unpublished)
  expect(visible.length).toBeGreaterThan(0)
  expect(visible.every((l) => l.apiRating), "every visible listing came from the API").toBe(true)
  errors.assertNone()
})

test("sign-in uses the real phone-code flow and store actions call the API", async ({ page }) => {
  // A spare allowlisted number keeps the personas' numbers for the journeys: staging rate-limits codes per number
  const phone = phones.spare1 ?? phones.customer
  test.skip(!phone, "Set ANSWERD_STAGING_TEST_PHONES with an allowlisted number (issue #2)")
  const F = app(page)
  await start(page)
  await page.goto("/app/sign-in/phone")
  await F.locator("#phone").fill(national(phone!))
  await F.getByRole("button", { name: "Send code" }).click()
  await expect(page).toHaveURL(/\/app\/sign-in\/code/)
  await F.getByLabel("Digit 1 of 6").click()
  await page.keyboard.type(OTP)
  await expect(page).not.toHaveURL(/\/app\/sign-in\/code/)
  // A number that isn't a demo persona gets C-08 "About you" first
  if (/\/app\/sign-in\/about-you/.test(page.url())) {
    await F.locator("#first").fill("Staging")
    await F.getByRole("button", { name: "Continue" }).click()
    await expect(page).not.toHaveURL(/\/app\/sign-in/)
  }

  // A bridged action: saving (or unsaving) a listing posts to the API with the user's token
  await page.goto("/app/b/swift-plumbing-heating")
  const saved = page.waitForResponse((r) => /\/api\/answerd\/v1\/listings\/[^/]+\/save$/.test(new URL(r.url()).pathname) && r.request().method() === "POST", { timeout: 90_000 })
  await F.getByRole("button", { name: /^(Save|Remove) Swift Plumbing/ }).click()
  expect((await saved).status(), "POST /v1/listings/{id}/save").toBeLessThan(300)

  await page.goto("/hub")
  await expect(page.locator("#data-source")).toContainText(national(phone!))
  await expect(page.locator("#data-source")).toContainText(/Realtime\s*open/, { timeout: 60_000 })
})
