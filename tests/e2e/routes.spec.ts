import { expect, test } from "@playwright/test"
import { SITE_URL } from "@/lib/site"
import { ROUTED, prepare, withClean } from "./screens"

// Every screen in lib/screens.ts loads as the right persona, with no 404, no console errors and no "#" links.
for (const s of ROUTED) {
  test(`${s.id} ${s.title} loads cleanly`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text())
    })
    await prepare(page, s)
    const res = await page.goto(withClean(s.example))
    expect(res?.status(), `${s.example} status`).toBeLessThan(400)
    await page.waitForTimeout(500)
    const hashLinks = await page.locator('a[href="#"], a:not([href])').evaluateAll((els) => els.filter((e) => !e.closest("[aria-hidden=true]")).map((e) => e.outerHTML.slice(0, 120)))
    expect(hashLinks, "links with no destination").toEqual([])
    expect(errors, errors.join("\n")).toEqual([])
  })
}

// The prototype has no website of its own: "/" opens the hub and public web URLs go to the website.
test("website URLs redirect to the website; / opens the hub", async ({ request }) => {
  const to = async (path: string) => (await request.get(path, { maxRedirects: 0 })).headers().location
  expect(await to("/")).toBe("/hub")
  expect(await to("/b/swift-plumbing-heating")).toBe(`${SITE_URL}/b/swift-plumbing-heating`)
  expect(await to("/b/swift-plumbing-heating/book")).toBe(`${SITE_URL}/b/swift-plumbing-heating`)
  expect(await to("/plumbers/croydon")).toBe(`${SITE_URL}/plumbers/croydon`)
  expect(await to("/claim?listing=norwood-locksmiths")).toBe(`${SITE_URL}/claim?listing=norwood-locksmiths`)
  expect(await to("/legal/privacy")).toBe(`${SITE_URL}/privacy`)
  expect(await to("/pricing")).toBe(`${SITE_URL}/billing`)
  expect(await to("/hub")).toBeUndefined()
})
