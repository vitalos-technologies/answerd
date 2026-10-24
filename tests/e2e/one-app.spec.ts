import { expect, test } from "@playwright/test"
import { app, as, start, state, watchErrors } from "./helpers"

// One app: the mode switch from Account (C-39), More (B-41) and a business notification (C-46) lands on the right
// screen and is remembered after a reload; staff open in business mode.
test("mode switches land on the right screen and are remembered", async ({ page }) => {
  test.setTimeout(240_000)
  const errors = watchErrors(page)
  const F = app(page)
  const reopen = async () => {
    await page.goto("/app/splash")
    await page.waitForURL((u) => u.pathname !== "/app/splash", { timeout: 15_000 })
  }
  await start(page, "sam")

  // More → customer mode → C-09, remembered
  await page.goto("/app/biz/more")
  await F.getByRole("button", { name: "Switch to customer mode" }).or(F.getByRole("link", { name: "Switch to customer mode" })).first().click()
  await expect(page).toHaveURL(/\/app$/)
  expect((await state(page)).session.mode).toBe("customer")
  await reopen()
  await expect(page).toHaveURL(/\/app$/)

  // Account → business mode → B-18, remembered
  await page.goto("/app/account")
  await F.getByRole("button", { name: "Switch to business mode" }).or(F.getByRole("link", { name: "Switch to business mode" })).first().click()
  await expect(page).toHaveURL(/\/app\/biz$/)
  expect((await state(page)).session.mode).toBe("business")
  await reopen()
  await expect(page).toHaveURL(/\/app\/biz$/)

  // A business notification opened from customer mode switches to business mode and opens its screen
  await page.goto("/app/biz/more")
  await F.getByRole("button", { name: "Switch to customer mode" }).or(F.getByRole("link", { name: "Switch to customer mode" })).first().click()
  await expect(page).toHaveURL(/\/app$/)
  await page.goto("/app/notifications")
  const row = F.getByRole("listitem").filter({ hasText: "Business" }).first().getByRole("button")
  const title = (await row.innerText()).split("\n")[0]!.trim()
  const n = (await state(page)).notifications.find((x) => x.userId === "u-sam" && x.title === title)!
  expect((n as unknown as { mode: string }).mode).toBe("business")
  await row.click()
  await expect(page).toHaveURL(new RegExp(n.href.split("?")[0]!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  expect((await state(page)).session.mode).toBe("business")
  await reopen()
  await expect(page).toHaveURL(/\/app\/biz$/)

  // Staff open in business mode
  await as(page, "jo")
  expect((await state(page)).session.mode).toBe("business")
  await reopen()
  await expect(page).toHaveURL(/\/app\/biz$/)
  errors.assertNone()
})
