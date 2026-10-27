"use client"
// What API mode is doing right now, for the hub's "Data source" panel. Not persisted.
import { create } from "zustand"
import { API_URL, apiMode } from "./config"

export interface ApiCallLog {
  at: number
  method: string
  path: string
  status: number | "network"
  ms: number
  /** The store action that made the call, if any */
  action?: string
}

export type RealtimeState = "off" | "connecting" | "open" | "closed"

interface ApiStatus {
  mode: "mock" | "api"
  url: string
  realtime: RealtimeState
  /** Why the relay last closed, if it said */
  realtimeReason: string | null
  user: { id: string; phone: string; name?: string | null } | null
  sync: { state: "idle" | "running" | "done" | "error"; listings: number; at: number | null; error?: string }
  calls: ApiCallLog[]
  /** Store actions that ran locally only: no endpoint yet, or the thing has no API id (mock data) */
  localOnly: Record<string, number>
  /** Local id → API id, for things created through the API and for the signed-in user's businesses */
  ids: Record<string, string>
  /** Latest realtime events */
  events: { at: number; type: string }[]
}

export const useApiStatus = create<ApiStatus>(() => ({
  mode: apiMode ? "api" : "mock",
  url: API_URL,
  realtime: "off",
  realtimeReason: null,
  user: null,
  sync: { state: "idle", listings: 0, at: null },
  calls: [],
  localOnly: {},
  ids: {},
  events: [],
}))

export function logCall(c: ApiCallLog) {
  useApiStatus.setState((s) => ({ calls: [c, ...s.calls].slice(0, 50) }))
}
