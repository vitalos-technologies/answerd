"use client"
// Turns API mode on once the persisted store has rehydrated: wraps the store actions, pulls the catalogue and,
// when there is an API session, learns the user's businesses and opens realtime. Signing out of the demo also
// ends the API session. No-op in mock mode.
import { useStore } from "@/lib/store"
import { apiMode } from "./config"
import { installBridge, learnBusinesses, startRealtime, stopRealtime } from "./bridge"
import { reapplyCatalogue, syncCatalogue } from "./catalogue"
import { logout } from "./client"
import { getSession } from "./session"
import { useApiStatus } from "./status"

let booted = false

export function bootApiMode() {
  if (!apiMode || booted) return
  booted = true
  installBridge()
  void syncCatalogue()
  const s = getSession()
  if (s) {
    useApiStatus.setState({ user: { id: s.userId, phone: s.phone } })
    void learnBusinesses()
    startRealtime()
  }
  useStore.subscribe((now, prev) => {
    // "Reset demo data" brings the seed back: lay the API catalogue over it again
    if (now.listings !== prev.listings && prev.listings.some((l) => l.apiRating) && !now.listings.some((l) => l.apiRating)) reapplyCatalogue()
    if (prev.session.userId && !now.session.userId && getSession()) {
      stopRealtime()
      void logout()
    }
  })
}

/** Called by the sign-in screen after a real phone-code sign-in. */
export async function afterApiSignIn() {
  await learnBusinesses()
  startRealtime()
}
