import { expect, test, type Page } from "@playwright/test"
import { advance, app, start, state, watchErrors } from "./helpers"

/** The hub persona switch: signs in and opens the admin session for staff personas. */
async function persona(page: Page, name: string) {
  await page.goto("/hub")
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click()
}

interface Demo {
  session: { impersonation?: unknown; supportViewBusinessId: string | null; userId: string | null }
  audit: { action: string; targetId: string; reason: string }[]
}

// J10: the super admin views Sam's business from S-09, can't edit, and the view shows in S-10.
test("J10 super admin views a business read-only from S-09; it is time-limited and lands in S-10", async ({ page }) => {
  const errors = watchErrors(page)
  await start(page, "guest")
  await persona(page, "Temitope A.")

  await page.goto("/admin/super/impersonate")
  await expect(page.getByRole("heading", { name: "Impersonate and data requests", level: 1 })).toBeVisible()
  await page.getByLabel("Business", { exact: true }).selectOption({ label: "Swift Plumbing & Heating · Sam Okafor (owner), Jo Reid (staff)" })
  await page.getByLabel("For", { exact: true }).selectOption("60")
  await page.getByRole("button", { name: "View read-only" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "Owner called about their inbox" }).click()
  await dialog.getByRole("button", { name: "Open read-only" }).click()

  // The business's own screens, under the banner, read only
  await expect(page).toHaveURL(/\/app\/biz$/)
  await expect(app(page)).toContainText("Viewing as support (audited) · read only · ends 10am")
  await page.goto("/app/biz/profile/details")
  await expect(app(page)).toContainText("Read only for support")
  await expect(app(page).locator("fieldset[disabled]")).toHaveCount(1)
  await expect(app(page).getByRole("textbox").first()).toBeDisabled()

  let st = await state<Demo>(page)
  expect(st.session.supportViewBusinessId).toBe("biz-swift-plumbing-heating")
  expect(st.audit[0]).toMatchObject({ action: "impersonate.start_business", targetId: "biz-swift-plumbing-heating" })

  // Time-limited on the demo clock: +2 hours ends it, audited
  await advance(page, "+2 hours")
  st = await state<Demo>(page)
  expect(st.session.impersonation).toBeNull()
  expect(st.session.supportViewBusinessId).toBeNull()
  expect(st.audit.map((a) => a.action)).toContain("impersonate.expired")

  // A read-only view as a customer, ended from the banner
  await page.goto("/admin/super/impersonate")
  await page.getByRole("radio", { name: "Customer" }).click()
  await page.getByLabel("Customer", { exact: true }).selectOption({ label: "Tayo Adeyemi · 07700 900123" })
  await page.getByRole("button", { name: "View read-only" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Customer can't see a booking" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Open read-only" }).click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(app(page)).toContainText("Viewing as Tayo A. (audited) · read only")
  await expect(app(page).locator("main fieldset[disabled]")).toHaveCount(1)
  await app(page).getByRole("button", { name: "Exit" }).click()
  await expect(page).toHaveURL(/\/admin\/super\/impersonate$/)
  st = await state<Demo>(page)
  expect(st.session.userId).toBe("u-temitope")

  // S-10 lists the views
  await page.goto("/admin/super/security")
  await page.getByPlaceholder("Search person, action, record or detail").fill("impersonate.start")
  await expect(page.getByRole("cell", { name: "impersonate.start_business" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "impersonate.start_customer" })).toBeVisible()

  // An admin can't open the super admin screens or see the section
  await persona(page, "Ife Bello")
  await page.goto("/admin/super/impersonate")
  await expect(page.getByRole("heading", { name: "Super admin only" })).toBeVisible()
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("button", { name: /Super admin/ })).toHaveCount(0)
  await page.goto("/admin/users")
  await expect(page.getByRole("row", { name: /Temitope Agbola/ })).toContainText("Only a super admin can change this")
  errors.assertNone()
})
