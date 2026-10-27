import { expect, type Page } from "@playwright/test"
import type { PersonaId } from "@/lib/types"

type StoreWindow = Window & { __answerdStore: { getState: () => { hydrated: boolean; setCookieConsent: (c: { analytics: boolean; marketing: boolean }) => void } } }

/** Set by playwright.api.config.ts: the app under test runs against the Answerd API. */
export const API_MODE = !!process.env.NEXT_PUBLIC_ANSWERD_API_URL

/** The phone frame: app screens render inside it. */
export const app = (page: Page) => page.locator("[data-phone-frame]")

/** Fresh seed, signed in as a persona (or guest), with the cookie choice made so banners don't cover controls. */
export async function start(page: Page, persona: PersonaId = "guest") {
  await page.goto("/hub")
  await page.waitForFunction(() => Boolean((window as unknown as StoreWindow).__answerdStore?.getState().hydrated))
  await page.getByRole("button", { name: /Reset demo data/ }).click()
  await page.evaluate(() => (window as unknown as StoreWindow).__answerdStore.getState().setCookieConsent({ analytics: false, marketing: false }))
  // API mode (playwright.api.config.ts): wait until the API's catalogue is in the store
  if (API_MODE) await expect(page.getByTestId("api-sync")).toHaveAttribute("data-state", "done", { timeout: 180_000 })
  if (persona !== "guest") await as(page, persona)
}

/** Switch persona the way the hub does. */
export async function as(page: Page, persona: PersonaId) {
  await page.goto("/hub")
  await page.waitForFunction(() => Boolean((window as unknown as StoreWindow).__answerdStore?.getState().hydrated))
  await page.evaluate((p) => {
    const s = (window as unknown as StoreWindow).__answerdStore.getState() as unknown as { signOut: () => void; signIn: (p: string) => void }
    if (p === "guest") s.signOut()
    else s.signIn(p)
  }, persona)
}

/** Hub clock buttons: "+2 hours" or "+1 day". */
export async function advance(page: Page, label: "+2 hours" | "+1 day", times = 1) {
  await page.goto("/hub")
  for (let i = 0; i < times; i++) {
    await page.getByRole("button", { name: label, exact: true }).click()
    await page.waitForTimeout(200)
  }
}

/** A snapshot of the persisted demo store. */
export async function state<T = Demo>(page: Page): Promise<T> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("answerd-demo-v1") ?? "{}").state)
}

/** Fails the test on uncaught errors and console errors. */
export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => {
    // API mode: a refused API call is logged by the browser; the hub's log shows it, and the local action still ran
    if (API_MODE && m.location().url.includes("/api/answerd/")) return
    if (m.type() === "error") errors.push(m.text())
  })
  return { assertNone: () => expect(errors, errors.join("\n")).toEqual([]) }
}

/** Typed loosely: the tests only read a few fields. */
export interface Demo {
  clock: string
  session: { userId: string | null; mode: string; currentBusinessId: string | null }
  bookings: { id: string; customerId: string | null; listingId: string; status: string; startAt: string; createdBy: string; reviewRequested?: boolean; createdAt: string }[]
  notifications: { userId: string; event: string; title: string; body: string; href: string }[]
  reviews: { id: string; listingId: string; stars: number; status: string; bookingId?: string }[]
  referrals: { kind: string; listingId?: string }[]
  threads: { id: string; listingId: string; customerId: string | null; status: string; deskActive: boolean }[]
  messages: { threadId: string; author: string; body: string; card?: { kind: string } }[]
  calls: { id: string; listingId: string; outcome: string; transcript?: { text: string }[]; bookingId?: string }[]
  listings: { id: string; slug: string; layer: string; businessId?: string; badges: string[] }[]
  businesses: { id: string; listingId: string; status: string }[]
  claims: { id: string; listingId: string; status: string; method: string }[]
  credentials: { id: string; businessId: string; type: string; status: string }[]
  deskConfigs: { businessId: string; status: string; trialUsed: boolean }[]
  subscriptions: { businessId: string; plan: string; status: string }[]
  audit: { action: string; targetId: string; reason: string }[]
}
