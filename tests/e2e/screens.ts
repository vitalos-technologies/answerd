import type { Page } from "@playwright/test"
import { SCREENS, type ScreenDef } from "@/lib/screens"
import type { PersonaId } from "@/lib/types"

type W = Window & { __answerdStore: { getState: () => Record<string, (...a: unknown[]) => unknown> & { hydrated: boolean } } }

/** Every routed screen (desk behaviours and Ask Answerd steps run inside other screens). */
export const ROUTED = SCREENS.filter((s) => s.surface !== "desk" && s.surface !== "ask")

const SIGN_IN_FLOW = ["C-01", "C-02", "C-03", "C-04", "C-05", "C-06", "C-07", "C-08"]
const DASHBOARD = /^W-1[3-9]$/

/** Who should be looking at a screen for it to show its main state. */
export function personaFor(s: ScreenDef): PersonaId {
  if (s.surface === "admin") return s.id === "A-01" ? "guest" : "ife"
  if (s.surface === "business") return "sam"
  if (s.surface === "web") return DASHBOARD.test(s.id) ? "sam" : "guest"
  return SIGN_IN_FLOW.includes(s.id) ? "guest" : "tayo"
}

export function viewportFor(s: ScreenDef) {
  if (s.surface === "customer" || s.surface === "business") return { width: 390, height: 844 }
  if (s.surface === "admin" || DASHBOARD.test(s.id)) return { width: 1280, height: 900 }
  return { width: 1440, height: 900 }
}

/** Fresh seed, the right persona, cookie choice made. */
export async function prepare(page: Page, s: ScreenDef) {
  await page.goto("/hub?clean=1")
  await page.waitForFunction(() => Boolean((window as unknown as W).__answerdStore?.getState().hydrated))
  const persona = personaFor(s)
  await page.evaluate(
    ([p, admin]) => {
      const store = (window as unknown as W).__answerdStore
      store.getState().resetDemo()
      if (p !== "guest") store.getState().signIn(p)
      if (admin) store.getState().adminSignIn()
      store.getState().setCookieConsent({ analytics: false, marketing: false })
    },
    [persona, s.surface === "admin" && s.id !== "A-01"] as const,
  )
}

export const withClean = (url: string) => url + (url.includes("?") ? "&" : "?") + "clean=1"
