import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { ROUTED, prepare, viewportFor, withClean } from "./screens"

// axe on every screen at its viewport: no serious or critical violations.
for (const s of ROUTED) {
  test(`${s.id} ${s.title} has no serious accessibility issues`, async ({ page }) => {
    await page.setViewportSize(viewportFor(s))
    await prepare(page, s)
    await page.goto(withClean(s.example))
    await page.waitForTimeout(600)
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    const summary = bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)
    expect(summary, summary.join("\n")).toEqual([])
  })
}
