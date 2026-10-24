import { expect, test } from "@playwright/test"
import { app, start, watchErrors } from "./helpers"

// J8: Ask Answerd "I can smell gas" shows the safety card with 0800 111 999 and no booking buttons.
test("J8 Ask Answerd gas emergency shows the safety card and no booking actions", async ({ page }) => {
  const errors = watchErrors(page)
  const F = app(page)
  await start(page, "tayo")
  await page.goto("/app/ask")
  await F.getByPlaceholder("Describe the job…").fill("I can smell gas in my kitchen")
  await F.getByRole("button", { name: "Send", exact: true }).click()
  const call = F.locator('a[href="tel:0800111999"]')
  await expect(call).toBeVisible({ timeout: 10_000 })
  await expect(F).toContainText("0800 111 999")
  await expect(F.getByRole("link", { name: /^Book/ })).toHaveCount(0)
  await expect(F.getByRole("button", { name: /^Book/ })).toHaveCount(0)
  errors.assertNone()
})
