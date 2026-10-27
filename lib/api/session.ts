"use client"
// API mode sign-in session: access and refresh tokens from the phone-code flow, kept in localStorage for this
// prototype (the Expo app will use the keychain). Mock mode never touches it.
import type { ApiSession } from "./types"

const KEY = "answerd-api-session"
const DEVICE = "answerd-api-device"

export interface StoredSession {
  accessToken: string
  refreshToken: string
  userId: string
  phone: string
}

export function getSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

export function setSession(s: ApiSession, phone: string) {
  const v: StoredSession = { accessToken: s.accessToken, refreshToken: s.refreshToken, userId: s.user?.id ?? "", phone }
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    /* storage blocked: signed in for this page only */
  }
  return v
}

export function updateTokens(s: ApiSession) {
  const cur = getSession()
  if (cur) setSession({ ...s, user: s.user ?? { id: cur.userId } }, cur.phone)
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE)
    if (!id) {
      id = `proto-${crypto.randomUUID()}`
      localStorage.setItem(DEVICE, id)
    }
    return id
  } catch {
    return "proto-ephemeral"
  }
}
