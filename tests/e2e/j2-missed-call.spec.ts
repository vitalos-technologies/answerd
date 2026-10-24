import { expect, test } from "@playwright/test"
import { app, start, state, watchErrors } from "./helpers"

// J2: Tayo calls Brightwire (desk paused), no answer, messages instead, then opens a similar listing.
test("J2 missed call to a paused-desk business, message instead, then a similar listing", async ({ page }) => {
  const errors = watchErrors(page)
  const F = app(page)
  await start(page, "tayo")

  await page.goto("/app/b/brightwire-electrical")
  await expect(F).not.toContainText("Responds instantly")
  await F.getByRole("link", { name: /^Call/ }).first().click()
  await expect(page).toHaveURL(/\/app\/b\/brightwire-electrical\/call$/)
  // Desk is paused, so the desk can't pick up
  await expect(F).not.toContainText("their Answerd desk will pick up")
  await F.getByRole("button", { name: "Call now" }).click()
  await expect(F.getByRole("button", { name: "Answerd desk answered" })).toHaveCount(0)
  await F.getByRole("button", { name: "No answer" }).click()
  await expect(page).toHaveURL(/\/app\/b\/brightwire-electrical\/after-call\?call=/)

  await F.getByRole("button", { name: "No answer" }).click()
  await expect(F).toContainText("Sorry they didn't pick up")
  const similarHref = await F.getByRole("link", { name: "Try similar" }).getAttribute("href")
  expect(similarHref).toContain("/app/results?category=")

  // Message instead
  await F.getByRole("link", { name: "Message instead" }).click()
  await expect(page).toHaveURL(/\/app\/b\/brightwire-electrical\/enquiry$/)
  await F.locator("#text").fill("Hi, I tried calling. Can you fit two new sockets in my kitchen this week?")
  await F.getByRole("button", { name: "Send" }).click()
  // First message: the app asks once about notifications (C-04)
  await expect(page).toHaveURL(/\/app\/onboarding\/notifications\?next=/)
  await F.getByRole("button", { name: "Not now" }).click()
  await expect(page).toHaveURL(/\/app\/messages\//)
  await expect(F).toContainText("two new sockets")

  let st = await state(page)
  const call = st.calls.find((c) => c.listingId === "l-brightwire-electrical" && c.outcome === "missed")
  expect(call).toBeTruthy()
  const thread = st.threads.find((t) => t.listingId === "l-brightwire-electrical" && t.customerId === "u-tayo")!
  expect(thread).toBeTruthy()
  // The paused desk doesn't answer the message
  await page.waitForTimeout(1500)
  st = await state(page)
  expect(st.messages.filter((m) => m.threadId === thread.id && m.author === "desk")).toHaveLength(0)

  // Then a similar listing
  await page.goto(similarHref!)
  const other = F.locator('a[href^="/app/b/"]').filter({ hasNotText: "Brightwire" }).first()
  const name = (await other.innerText()).split("\n").find((l) => l.trim().length > 3)!
  await other.click()
  await expect(page).toHaveURL(/\/app\/b\/(?!brightwire-electrical)[a-z0-9-]+$/)
  await expect(F).toContainText(name.trim())
  errors.assertNone()
})
