import { expect, test } from "@playwright/test"
import { app, start, state, watchErrors } from "./helpers"

// J6: trigger the monetise gate; Sam upgrades on W-18; the plan is active on B-36.
test("J6 monetise gate, upgrade to the AI desk on the web, plan active in the app", async ({ page }) => {
  const errors = watchErrors(page)
  await start(page, "sam")

  // Before the gate, paid plans are locked. Swift has 9 of 10 enquiries and day 60 (Fri 30 Oct) is still ahead:
  // with both halves missing the button names the enquiries
  await page.goto("/dashboard/billing")
  await expect(page.getByRole("button", { name: /Available after 10 enquiries/ }).first()).toBeDisabled()

  await page.goto("/hub")
  await page.getByRole("button", { name: /Trigger monetise gate/ }).click()

  await page.goto("/dashboard/billing")
  // Design review (25 Oct): once the gate is open the desk button reads "Keep your desk for £49/month"
  await page.getByRole("link", { name: /Keep your desk for £49\/month/ }).first().click()
  await expect(page).toHaveURL(/\/dashboard\/billing\/checkout\?plan=desk/)
  await expect(page.getByText("Prototype checkout, no card needed")).toBeVisible()
  await expect(page.locator("main")).toContainText("£58.80")
  await page.getByRole("button", { name: /Confirm/ }).click()
  await expect(page).toHaveURL(/\/dashboard\/billing\?checkout=success$/)

  const st = await state(page)
  expect(st.subscriptions.find((x) => x.businessId === "biz-swift-plumbing-heating" && x.plan === "desk")?.status).toBe("active")

  // B-36 in the app matches
  await page.goto("/app/biz/billing")
  await expect(app(page)).toContainText(/Current plan\s*AI desk\s*£49\/month ex VAT/)
  errors.assertNone()
})
