import { expect, test, type Page } from "@playwright/test"
import { app, start, state, watchErrors } from "./helpers"

const toSetup = (page: Page) => expect(page).toHaveURL(/\/app\/biz\/setup$/)

// J5: Sam claims Norwood Locksmiths by phone code, completes setup, starts the desk trial, runs a test call.
test("J5 claim by phone code, complete setup, start the desk trial and run a test call", async ({ page }) => {
  test.setTimeout(300_000)
  const errors = watchErrors(page)
  const F = app(page)
  await start(page, "sam")

  // Claim from the unclaimed listing (C-17 → B-01 prefilled → B-02 → B-04 → B-05 → B-08)
  await page.goto("/app/b/norwood-locksmiths")
  await F.getByRole("link", { name: /Claim this business/ }).first().click()
  await expect(page).toHaveURL(/\/app\/biz\/claim\?listing=/)
  await F.getByRole("link", { name: /Norwood Locksmiths/ }).first().click()
  await expect(page).toHaveURL(/\/app\/biz\/claim\/l-norwood-locksmiths$/)
  await expect(F).toContainText("tried to reach you this month")
  await F.getByRole("button", { name: "Yes, claim it" }).click()
  await expect(page).toHaveURL(/\/verify$/)
  // The listed number is a landline, so "Text a code" is hidden
  await expect(F.getByRole("button", { name: /Text a code/ })).toHaveCount(0)
  await F.getByRole("button", { name: /Call me with a code/ }).click()
  await expect(page).toHaveURL(/\/verify\/code\?method=call$/)
  await F.getByLabel("Digit 1 of 6").click()
  await page.keyboard.type("000000")
  await expect(F).toContainText("didn't match")
  await F.getByLabel("Digit 1 of 6").click()
  await page.keyboard.type("482917")
  await expect(page).toHaveURL(/\/claim\/l-norwood-locksmiths\/done$/)
  await expect(F).toContainText("Norwood Locksmiths is yours")
  await expect(F).toContainText("6 calls")

  let st = await state(page)
  expect(st.listings.find((l) => l.id === "l-norwood-locksmiths")!.layer).toBe("claimed")
  const bizId = st.businesses.find((b) => b.listingId === "l-norwood-locksmiths")!.id
  expect(st.session).toMatchObject({ mode: "business", currentBusinessId: bizId })

  // Setup checklist (B-09 to B-17)
  await page.goto("/app/biz/profile/services")
  await F.getByRole("link", { name: /Add service/ }).click()
  await expect(page).toHaveURL(/\/profile\/services\/new$/)
  await F.locator("#sv-name").fill("Lock change")
  await F.locator("#sv-desc").fill("Change a front or back door lock, with new keys.")
  await F.getByRole("radio", { name: "From £" }).click()
  await F.locator("#sv-price").fill("80")
  await F.getByRole("button", { name: "Add service" }).click()
  await expect(page).toHaveURL(/\/profile\/services$/)
  await F.getByRole("link", { name: /Add service/ }).click()
  await F.locator("#sv-name").fill("Emergency lockout")
  await F.locator("#sv-desc").fill("Locked out? We aim to be with you within the hour.")
  await F.getByRole("radio", { name: "Fixed £" }).click()
  await F.locator("#sv-price").fill("95")
  await F.getByRole("button", { name: "Add service" }).click()
  await expect(page).toHaveURL(/\/profile\/services$/)

  await page.goto("/app/biz/profile/hours")
  await F.getByRole("button", { name: "Save" }).click()
  await toSetup(page)

  await page.goto("/app/biz/profile/area")
  await F.locator("#ar-radius").fill("3")
  await F.getByRole("button", { name: "Save" }).click()
  await toSetup(page)

  await page.goto("/app/biz/profile/photos")
  await F.getByLabel("Upload photos").setInputFiles([
    { name: "van.jpg", mimeType: "image/jpeg", buffer: Buffer.from("x") },
    { name: "new-lock.jpg", mimeType: "image/jpeg", buffer: Buffer.from("y") },
  ])
  await F.getByRole("button", { name: "Save" }).click()
  await toSetup(page)

  await page.goto("/app/biz/profile/credentials")
  await F.getByRole("button", { name: /Add a credential/ }).click()
  await page.locator("#cr-type").selectOption("insurance")
  await page.getByLabel("Choose a certificate file").setInputFiles({ name: "insurance.pdf", mimeType: "application/pdf", buffer: Buffer.from("z") })
  await page.locator("#cr-exp").fill("2027-09-30")
  await page.getByRole("button", { name: "Send for checking" }).click()

  await page.goto("/app/biz/profile/booking")
  await F.getByRole("button", { name: "Save" }).click()
  await toSetup(page)
  await expect(F).toContainText("100%")

  // Desk trial and setup (B-30, B-31), test call inside step 5
  await page.goto("/app/biz/desk/intro")
  await expect(F).not.toContainText("Askbridge")
  await F.getByRole("button", { name: "Start 14-day free trial" }).click()
  await expect(page).toHaveURL(/\/app\/biz\/desk\/setup$/)
  await F.getByRole("button", { name: "I've set it up" }).click()
  await page.waitForTimeout(2000)
  await F.getByRole("button", { name: "Next", exact: true }).click()
  await F.getByRole("button", { name: "Next", exact: true }).click()
  await F.getByRole("button", { name: "Next", exact: true }).click()
  await F.getByRole("button", { name: "Save and continue" }).click()
  await F.getByRole("button", { name: "Start test call" }).click()
  await expect(F.getByText("Booking made in your diary")).toBeVisible({ timeout: 45_000 })
  await F.getByRole("button", { name: "Next", exact: true }).click()
  await F.getByRole("button", { name: "Go live", exact: true }).click()
  await expect(page).toHaveURL(/\/app\/biz\/desk$/)

  st = await state(page)
  expect(st.deskConfigs.find((d) => d.businessId === bizId)).toMatchObject({ status: "live", trialUsed: true })
  const deskJob = st.bookings.find((b) => b.listingId === "l-norwood-locksmiths" && b.createdBy === "desk")
  expect(deskJob?.status).toBe("confirmed")
  await page.goto(`/app/biz/diary?day=${deskJob!.startAt.slice(0, 10)}`)
  await expect(F).toContainText(/Lock change|Emergency lockout/)
  errors.assertNone()
})
