import { expect, test } from "@playwright/test"
import { advance, app, start, state, watchErrors } from "./helpers"

// J3: Tayo messages Sparkle Clean out of hours; the desk replies with slots; Tayo books from a slot card.
test("J3 out-of-hours message gets a desk reply with free times, booked from the slot card", async ({ page }) => {
  const errors = watchErrors(page)
  const F = app(page)
  await start(page, "tayo")
  // Mon 26 Oct 9am + 10 hours = 7pm, after Sparkle closes at 6pm
  await advance(page, "+2 hours", 5)
  expect((await state(page)).clock).toBe("2026-10-26T19:00:00.000Z")

  await page.goto("/app/b/sparkle-clean-co")
  await F.getByRole("link", { name: /^Message/ }).first().click()
  // Tayo has messaged Sparkle before, so Message opens the existing conversation (C-22)
  await expect(page).toHaveURL(/\/app\/messages\/t-tayo-sparkle$/)
  const before = (await state(page)).messages.filter((m) => m.threadId === "t-tayo-sparkle").length
  await F.getByPlaceholder("Message").fill("Hi, could you do a regular clean of a 2-bed flat this week?")
  await F.getByRole("button", { name: "Send", exact: true }).click()
  const threadId = page.url().split("/").pop()!

  // The desk replies (labelled as the Answerd desk) with free times
  await expect.poll(async () => (await state(page)).messages.filter((m) => m.threadId === "t-tayo-sparkle").length, { timeout: 15_000 }).toBeGreaterThan(before + 1)
  await expect(F).toContainText("Answerd desk")
  const st0 = await state(page)
  const reply = st0.messages.filter((m) => m.threadId === threadId).at(-1)!
  expect(reply).toMatchObject({ author: "desk", card: { kind: "slot" } })

  // Pick a time from the desk's newest slot card: straight to confirm with the draft filled in
  await F.locator("button", { has: page.locator("span.tnum") }).last().click()
  await expect(page).toHaveURL(/\/app\/b\/sparkle-clean-co\/book\/confirm\?thread=/)
  await F.getByRole("button", { name: /Confirm booking|Send booking request/ }).click()
  await expect(page).toHaveURL(/\/app\/bookings\/[^/]+\/booked$/)

  const st = await state(page)
  const booking = st.bookings.filter((b) => b.customerId === "u-tayo" && b.listingId === "l-sparkle-clean-co").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!
  expect(booking.status).toBe("confirmed")
  expect(booking.startAt > st.clock).toBe(true)
  errors.assertNone()
})
