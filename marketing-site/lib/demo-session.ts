"use client"
import * as React from "react"

/*
 * PROTOTYPE ONLY. The mock sign-in (W-12) and billing (W-18) pages keep their state in sessionStorage for
 * this tab: who is "signed in", which paid plans were "bought", and the gate preview. Nothing leaves the
 * browser. Replace with Workforce auth and Stripe before launch.
 */

export type DemoPlan = "desk" | "featured"
export type DemoState = {
  user: { name: string; business: string; slug: string } | null
  subs: { plan: DemoPlan; since: string }[]
  gateMet: boolean
}

const KEY = "answerd-demo"
const EVENT = "answerd-demo-change"
const EMPTY: DemoState = { user: null, subs: [], gateMet: false }
let cache: { raw: string | null; value: DemoState } = { raw: null, value: EMPTY }

function read(): DemoState {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(KEY)
  } catch {
    /* storage blocked */
  }
  if (raw === cache.raw) return cache.value
  let value = EMPTY
  try {
    value = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<DemoState>) } : EMPTY
  } catch {
    value = EMPTY
  }
  cache = { raw, value }
  return value
}

export function writeDemo(update: (s: DemoState) => DemoState) {
  const next = update(read())
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage blocked: the change lasts until reload */
    cache = { raw: JSON.stringify(next), value: next }
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}

/** The mock session; `undefined` on the server and during hydration. */
export function useDemo(): DemoState | undefined {
  return React.useSyncExternalStore(subscribe, read, () => undefined)
}

/** Only same-site paths are allowed as a ?next= target. */
export function safeNext(next: string | null, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback
}
