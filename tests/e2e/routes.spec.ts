import { expect, test } from "@playwright/test"
import { ROUTED, prepare, withClean } from "./screens"

// Every screen in lib/screens.ts loads as the right persona, with no 404, no console errors and no "#" links.
for (const s of ROUTED) {
  test(`${s.id} ${s.title} loads cleanly`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("console", (m) => {
      // W-24 is the not-found page: the browser logs the document's own 404
      if (m.type() === "error" && !(s.id === "W-24" && m.text().includes("status of 404"))) errors.push(m.text())
    })
    await prepare(page, s)
    const res = await page.goto(withClean(s.example))
    // W-24 is the not-found page itself
    if (s.id !== "W-24") expect(res?.status(), `${s.example} status`).toBeLessThan(400)
    await page.waitForTimeout(500)
    const hashLinks = await page.locator('a[href="#"], a:not([href])').evaluateAll((els) => els.filter((e) => !e.closest("[aria-hidden=true]")).map((e) => e.outerHTML.slice(0, 120)))
    expect(hashLinks, "links with no destination").toEqual([])
    expect(errors, errors.join("\n")).toEqual([])
  })
}
