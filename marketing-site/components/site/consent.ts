"use client"
import * as React from "react"

export type Consent = "all" | "essential"
export const CONSENT_KEY = "answerd-consent"
const KEY = CONSENT_KEY
const EVENT = "answerd-consent-change"

function read(): Consent | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === "all" || v === "essential" ? v : null
  } catch {
    return null
  }
}

export function setConsent(v: Consent | null) {
  // Keep the pre-paint flag in sync (see the inline script in app/layout.tsx)
  if (v) document.documentElement.dataset.consent = v
  else delete document.documentElement.dataset.consent
  try {
    if (v) localStorage.setItem(KEY, v)
    else localStorage.removeItem(KEY)
  } catch {
    /* storage blocked: the choice lasts for this page view */
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}

/**
 * The visitor's cookie choice. `undefined` during SSR/first paint, `null` before they choose.
 * Nothing non-essential (including the Askbridge script) may load until this is non-null.
 */
export function useConsent(): Consent | null | undefined {
  return React.useSyncExternalStore(subscribe, read, () => undefined)
}
