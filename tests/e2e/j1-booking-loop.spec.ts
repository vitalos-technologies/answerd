import { expect, test } from "@playwright/test"
import { advance, app, as, start, state, watchErrors } from "./helpers"

// J1: guest searches "boiler", books Swift Plumbing, signs in by phone, request sent; Sam accepts; Tayo notified;
// +3 days; Sam completes; Tayo reviews 5 stars and recommends.
test("J1 guest books, signs in, owner accepts and completes, customer reviews and recommends", async ({ page }) => {
  const errors = watchErrors(page)
  const F = app(page)
  await start(page, "guest")

  // Search as a guest
  await page.goto("/app/search")
  await F.getByPlaceholder("What service do you need?").fill("boiler")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/app\/results\?q=boiler/)
  await F.getByRole("link", { name: /Swift Plumbing & Heating/ }).first().click()
  await expect(page).toHaveURL(/\/app\/b\/swift-plumbing-heating$/)

  // Book: guests sign in by phone first
  await F.getByRole("link", { name: /^Book/ }).first().click()
  await expect(page).toHaveURL(/\/app\/sign-in\?next=/)
  await F.getByRole("button", { name: "Continue with phone" }).click()
  await F.locator("#phone").fill("07700 900123")
  await F.getByRole("button", { name: "Send code" }).click()
  await expect(page).toHaveURL(/\/app\/sign-in\/code/)
  await F.getByLabel("Digit 1 of 6").click()
  await page.keyboard.type("123456")
  await expect(page).toHaveURL(/\/app\/b\/swift-plumbing-heating\/book$/)
  expect((await state(page)).session.userId).toBe("u-tayo")

  await F.getByRole("radio", { name: /Boiler service/ }).click()
  await F.getByRole("button", { name: "Continue" }).click()
  await expect(page).toHaveURL(/\/book\/time$/)
  await F.getByRole("option", { name: /\b29\b/ }).click()
  await F.getByRole("button", { name: "10am", exact: true }).click()
  await F.getByRole("button", { name: "Continue" }).click()
  await expect(page).toHaveURL(/\/book\/details$/)
  await F.getByRole("button", { name: "Continue" }).click()
  await expect(page).toHaveURL(/\/book\/confirm$/)
  await F.getByRole("button", { name: "Send booking request" }).click()
  await expect(page).toHaveURL(/\/app\/bookings\/[^/]+\/booked$/)

  let st = await state(page)
  const req = st.bookings.filter((b) => b.customerId === "u-tayo" && b.status === "requested").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!
  expect(req.startAt).toBe("2026-10-29T10:00:00.000Z")

  // Sam accepts from Needs you
  await as(page, "sam")
  await page.goto("/app/biz")
  await F.getByRole("link", { name: /Booking request: Tayo A\./ }).click()
  await expect(page).toHaveURL(new RegExp(`/app/biz/requests/${req.id}$`))
  await F.getByRole("button", { name: "Accept" }).click()
  await expect(page).toHaveURL(new RegExp(`/app/biz/jobs/${req.id}$`))

  // Tayo is notified and sees Confirmed
  await as(page, "tayo")
  await page.goto("/app/notifications")
  await expect(F).toContainText("You're booked with Swift Plumbing & Heating, Thu 29 Oct, 10am")
  await page.goto(`/app/bookings/${req.id}`)
  await expect(F).toContainText("Confirmed")

  // +3 days, then Sam completes the job
  await advance(page, "+1 day", 3)
  expect((await state(page)).clock).toBe("2026-10-29T09:00:00.000Z")
  await as(page, "sam")
  await page.goto(`/app/biz/jobs/${req.id}`)
  for (const step of ["I'm on my way", "I've arrived", "Mark completed"]) {
    await F.getByRole("button", { name: step }).click()
    await page.waitForTimeout(200)
  }
  st = await state(page)
  expect(st.bookings.find((b) => b.id === req.id)).toMatchObject({ status: "completed", reviewRequested: true })

  // Tayo reviews 5 stars and recommends
  await as(page, "tayo")
  await page.goto(`/app/bookings/${req.id}/review`)
  await F.getByRole("radiogroup", { name: "Overall rating" }).getByRole("radio", { name: "5 stars" }).click()
  await F.locator("#text").fill("Sam serviced the boiler and explained everything. Spotless work.")
  await F.getByRole("button", { name: "Post review" }).click()
  await expect(page).toHaveURL(/\/review\/done$/)
  await F.getByRole("button", { name: "Share" }).click()
  await page.getByRole("button", { name: "WhatsApp" }).click()

  st = await state(page)
  expect(st.reviews.find((r) => r.bookingId === req.id)).toMatchObject({ stars: 5, status: "live" })
  expect(st.referrals.some((r) => r.kind === "recommend" && r.listingId === "l-swift-plumbing-heating")).toBe(true)
  errors.assertNone()
})
