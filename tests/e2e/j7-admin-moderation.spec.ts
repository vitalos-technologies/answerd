import { expect, test, type Page } from "@playwright/test"
import { start, state, watchErrors } from "./helpers"

type W = Window & { __answerdStore: { getState: () => Record<string, (...a: unknown[]) => unknown> & { session: { userId: string } } } }

async function signInAdmin(page: Page, email: string) {
  await page.goto("/admin/sign-in")
  await page.getByRole("button", { name: "Sign in with Google" }).click()
  await page.getByRole("button", { name: new RegExp(email) }).click()
  await page.getByLabel("Digit 1 of 6").click()
  await page.keyboard.type("123456")
  await expect(page).toHaveURL(/\/admin$/)
}

const ratingLine = async (page: Page) => (await page.locator("[data-phone-frame] main").innerText()).match(/(\d\.\d)\s*\n?\s*\((\d+)\)/)?.slice(1, 3).join(" from ")

// J7: Ife approves a claim and a credential and removes a review; badges and rating update; audit entries exist.
test("J7 admin approves a claim and a credential, removes a review; badges, rating and audit update", async ({ page }) => {
  const errors = watchErrors(page)
  await start(page, "guest")

  // A pending document claim from a new owner (the P4 flow, set up through the store)
  const ids = await page.evaluate(() => {
    const st = (window as unknown as W).__answerdStore.getState()
    const userId = st.createAccount({ phone: "07700 900555", firstName: "Ade", lastName: "Bakare", marketing: false, method: "phone" }) as string
    const s1 = (window as unknown as W).__answerdStore.getState()
    const lid = s1.createListing({ name: "Ade's Gardening", categoryId: "gardeners", phone: "07700 900555", postcode: "SE25 4AA", legalType: "sole_trader" }) as string
    const cid = s1.claimListing(lid, "document") as string
    s1.verifyClaim(cid, "document", { document: "ade-bank-letter.pdf", documentKind: "Bank letter" })
    ;(window as unknown as W).__answerdStore.getState().signOut()
    return { userId, lid, cid }
  })
  let st = await state(page)
  expect(st.claims.find((c) => c.id === ids.cid)!.status).toBe("pending")

  await page.goto("/app/b/sparkle-clean-co")
  await expect(page.locator("[data-phone-frame]")).not.toContainText(/\bDBS\b/)
  await page.goto("/app/b/swift-plumbing-heating")
  const ratingBefore = await ratingLine(page)

  await signInAdmin(page, "ife@vitalos.co.uk")

  // A-06: approve the claim
  await page.goto("/admin/claims")
  await page.getByRole("button", { name: /Ade's Gardening/ }).click()
  await page.getByRole("button", { name: "Approve", exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Name and address match the listing" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Approve", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)

  // A-07: approve Sparkle's DBS check
  await page.goto("/admin/credentials")
  await page.getByRole("button", { name: /Sparkle Clean Co/ }).click()
  await page.getByRole("button", { name: "Approve", exact: true }).click()
  await page.getByRole("dialog").locator("textarea").last().fill("DBS certificate checked against the update service")
  await page.getByRole("dialog").getByRole("button", { name: "Approve", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)

  // A-08: remove the flagged review on Swift
  await page.goto("/admin/reviews")
  await page.getByRole("button", { name: "Remove", exact: true }).first().click()
  await page.getByRole("dialog").getByRole("button", { name: "Fake: not a genuine customer" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Remove review", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)

  st = await state(page)
  expect(st.claims.find((c) => c.id === ids.cid)!.status).toBe("approved")
  expect(st.businesses.find((b) => b.listingId === ids.lid)!.status).toBe("live")
  expect(st.credentials.find((c) => c.businessId === "biz-sparkle-clean-co" && c.type === "dbs")!.status).toBe("verified")
  const actions = st.audit.map((a) => a.action)
  expect(actions).toEqual(expect.arrayContaining(["claim.approve", "credential.approve", "review.remove"]))
  expect(st.audit.every((a) => a.reason.trim().length > 0)).toBe(true)

  // Badges and rating update on the customer side
  await page.goto("/app/b/sparkle-clean-co")
  await expect(page.locator("[data-phone-frame]")).toContainText(/\bDBS\b/)
  await page.goto("/app/b/swift-plumbing-heating")
  const ratingAfter = await ratingLine(page)
  expect(ratingBefore).toMatch(/from 132$/)
  expect(ratingAfter).toMatch(/from 131$/)

  // The audit log screen lists the entries
  await page.goto("/admin/audit")
  await expect(page.getByText(ids.cid).first()).toBeVisible()
  errors.assertNone()
})
