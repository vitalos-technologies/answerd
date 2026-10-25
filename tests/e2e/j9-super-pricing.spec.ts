import { expect, test, type Page } from "@playwright/test"
import { app, as, start, state, watchErrors } from "./helpers"

type W = Window & { __answerdStore: { getState: () => Record<string, (...a: unknown[]) => unknown> } }

/** A-01 as the super admin: Google account on vitalos.co.uk, then the security key. */
async function signInSuper(page: Page) {
  await page.goto("/admin/sign-in")
  await page.getByRole("button", { name: "Sign in with Google" }).click()
  await page.getByRole("button", { name: /temitope@vitalos\.co\.uk/ }).click()
  await page.getByRole("button", { name: "Use your security key" }).click()
  await expect(page).toHaveURL(/\/admin$/)
}

// J9: the super admin changes the AI desk price in S-06; B-36 and W-18 show the new price. (W-10 pricing is on the
// website, marketing-site/, which has its own copy of the prices.)
test("J9 super admin changes the AI desk price; B-36 and W-18 follow", async ({ page }) => {
  const errors = watchErrors(page)
  await start(page, "guest")

  await signInSuper(page)
  // Only the super admin sees the Super admin section, at the top of the sidebar
  const nav = page.getByRole("navigation", { name: "Admin" })
  await expect(nav.getByRole("button", { name: /Super admin/ })).toBeVisible()

  await page.goto("/admin/super/pricing")
  await expect(page.getByRole("heading", { name: "Pricing and rules", level: 1 })).toBeVisible()
  const price = page.getByLabel("AI desk price")
  await expect(price).toHaveValue("49")
  await price.fill("59")
  await page.getByRole("button", { name: "Save new version" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("AI desk price: £49 → £59")
  await dialog.getByRole("button", { name: "Price review" }).click()
  await dialog.getByRole("button", { name: "Save and apply" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole("cell", { name: /AI desk price: £49 → £59/ })).toBeVisible()

  const st = await state<{ settings: { ruleVersions: { version: number; rules: { deskPricePence: number }; reason: string }[] }; audit: { action: string }[] }>(page)
  expect(st.settings.ruleVersions.at(-1)).toMatchObject({ version: 2, reason: "Price review", rules: { deskPricePence: 5900 } })
  expect(st.audit[0]!.action).toBe("rules.update")

  // B-36 in the app, as Sam
  await as(page, "sam")
  await page.goto("/app/biz/billing")
  await expect(app(page)).toContainText(/AI desk\s*£59\/month ex VAT \(£70\.80 inc VAT\)/)
  await expect(app(page).getByRole("button", { name: /Available after 10 enquiries/ }).first()).toBeDisabled()

  // W-18: open the gate, then the button and checkout carry the new price
  await page.evaluate(() => (window as unknown as W).__answerdStore.getState().triggerMonetiseGate())
  await page.goto("/dashboard/billing")
  await expect(page.locator("main")).toContainText("£59/month")
  await page.getByRole("link", { name: /Keep your desk for £59\/month/ }).first().click()
  await expect(page).toHaveURL(/\/dashboard\/billing\/checkout\?plan=desk/)
  await expect(page.locator("main")).toContainText("£70.80")
  await page.getByRole("button", { name: /Confirm and pay £70\.80/ }).click()
  await expect(page).toHaveURL(/\/dashboard\/billing\?checkout=success$/)
  const after = await state<{ subscriptions: { businessId: string; plan: string; status: string; pricePence: number }[] }>(page)
  expect(after.subscriptions.find((x) => x.businessId === "biz-swift-plumbing-heating" && x.plan === "desk")).toMatchObject({ status: "active", pricePence: 5900 })
  errors.assertNone()
})
