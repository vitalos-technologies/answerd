// Saves a PNG of every screen to docs/screens/[ID].png at its viewport, using ?clean=1. Web pages are also saved at
// 390 wide as [ID]-390.png. Desk behaviours are captured from the hub after running each script; Ask Answerd steps
// from /app/ask. Usage: pnpm build && pnpm start, then BASE_URL=http://localhost:3000 pnpm screenshots [ID-prefix…]
import { mkdirSync } from "node:fs"
import { chromium, type Browser, type Page } from "@playwright/test"
import { SCREENS, type ScreenDef } from "../lib/screens"
import { personaFor, viewportFor, withClean } from "../tests/e2e/screens"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const OUT = new URL("../docs/screens/", import.meta.url).pathname
const only = process.argv.slice(2)

type W = Window & { __answerdStore: { getState: () => Record<string, (...a: unknown[]) => unknown> & { hydrated: boolean } } }

async function prepare(page: Page, persona: string, admin = false) {
  await page.goto(`${BASE}/hub?clean=1`)
  await page.waitForFunction(() => Boolean((window as unknown as W).__answerdStore?.getState().hydrated))
  await page.evaluate(
    ([p, a]) => {
      const st = (window as unknown as W).__answerdStore
      st.getState().resetDemo()
      if (p !== "guest") st.getState().signIn(p)
      if (a) st.getState().adminSignIn()
      st.getState().setCookieConsent({ analytics: false, marketing: false })
    },
    [persona, admin] as const,
  )
}

async function shoot(page: Page, file: string) {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}${file}.png`, fullPage: false })
}

async function routed(browser: Browser, s: ScreenDef) {
  const sizes = [viewportFor(s)]
  if (s.surface === "web" && !/^W-1[3-9]$/.test(s.id)) sizes.push({ width: 390, height: 844 })
  for (const vp of sizes) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    await prepare(page, personaFor(s), s.surface === "admin" && s.id !== "A-01")
    await page.goto(BASE + withClean(s.example))
    await shoot(page, vp.width === 390 && s.surface === "web" ? `${s.id}-390` : s.id)
    await ctx.close()
  }
}

async function desk(browser: Browser, s: ScreenDef) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await ctx.newPage()
  await prepare(page, "sam")
  await page.goto(`${BASE}/hub?clean=1`)
  await page.locator("#simulate").getByRole("button", { name: new RegExp(`^${s.id}`) }).first().click()
  await page.waitForTimeout(9000)
  await page.locator("#simulate").scrollIntoViewIfNeeded()
  await shoot(page, s.id)
  await ctx.close()
}

const ASK: Record<string, { persona: string; text?: string; askCount?: number }> = {
  "Q-01": { persona: "tayo" },
  "Q-02": { persona: "tayo", text: "my boiler's making a banging noise, SE25" },
  "Q-03": { persona: "tayo", text: "deep clean SE19" },
  "Q-04": { persona: "tayo", text: "need a locksmith tonight in South Norwood" },
  "Q-05": { persona: "tayo", text: "I can smell gas" },
  "Q-06": { persona: "guest", askCount: 5 },
}

async function ask(browser: Browser, s: ScreenDef) {
  const cfg = ASK[s.id]!
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await prepare(page, cfg.persona)
  if (cfg.askCount) for (let i = 0; i < cfg.askCount; i++) await page.evaluate(() => (window as unknown as W).__answerdStore.getState().incrementAsk())
  await page.goto(`${BASE}/app/ask?clean=1`)
  if (cfg.text) {
    await page.getByPlaceholder("Describe the job…").fill(cfg.text)
    await page.getByRole("button", { name: "Send", exact: true }).click()
    await page.waitForTimeout(2000)
  }
  await shoot(page, s.id)
  await ctx.close()
}

;(async () => {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const list = SCREENS.filter((s) => !only.length || only.some((o) => s.id.startsWith(o)))
  for (const s of list) {
    try {
      if (s.surface === "desk") await desk(browser, s)
      else if (s.surface === "ask") await ask(browser, s)
      else await routed(browser, s)
      console.log("saved", s.id)
    } catch (e) {
      console.log("FAILED", s.id, String(e).split("\n")[0])
    }
  }
  await browser.close()
})()
