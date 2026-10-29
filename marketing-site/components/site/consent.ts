"use client"
import * as React from "react"

/** "chat" and "analytics" are the two Manage choices (W-23): one optional category each, the other off. */
export type Consent = "all" | "essential" | "chat" | "analytics"
const VALUES: readonly string[] = ["all", "essential", "chat", "analytics"]

/** Whether the visitor's choice allows an optional category. */
export function allows(consent: Consent | null | undefined, category: "chat" | "analytics") {
  return consent === "all" || consent === category
}
export const CONSENT_KEY = "answerd-consent"
const KEY = CONSENT_KEY
const EVENT = "answerd-consent-change"

function read(): Consent | null {
  try {
    const v = localStorage.getItem(KEY)
    return v && VALUES.includes(v) ? (v as Consent) : null
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
