"use client"
// API mode realtime: one WebSocket to /v1/realtime on the API's own origin while signed in. Browsers can't send
// an Authorization header on a WebSocket, so the access token goes in the query string (access_token).
// Reconnects with backoff (staging may be waking up) and hands each event to the bridge.
import { REALTIME_URL } from "./config"
import { getSession } from "./session"
import { useApiStatus } from "./status"

export interface RealtimeEvent {
  type: string
  data?: Record<string, unknown>
  [k: string]: unknown
}

let socket: WebSocket | null = null
let retry = 0
let timer: ReturnType<typeof setTimeout> | undefined
let wanted = false

export function connectRealtime(onEvent: (e: RealtimeEvent) => void) {
  wanted = true
  const s = getSession()
  if (!REALTIME_URL || !s || socket) return
  useApiStatus.setState({ realtime: "connecting" })
  const ws = new WebSocket(`${REALTIME_URL}?access_token=${encodeURIComponent(s.accessToken)}`)
  socket = ws
  ws.onopen = () => {
    retry = 0
    useApiStatus.setState({ realtime: "open" })
  }
  ws.onmessage = (m) => {
    try {
      const e = JSON.parse(String(m.data)) as RealtimeEvent
      if (e && typeof e.type === "string") onEvent(e)
    } catch {
      /* not JSON: ignore (pings) */
    }
  }
  ws.onclose = () => {
    socket = null
    useApiStatus.setState({ realtime: "closed" })
    if (!wanted) return
    const delay = Math.min(30_000, 1_000 * 2 ** retry++)
    timer = setTimeout(() => connectRealtime(onEvent), delay)
  }
}

export function disconnectRealtime() {
  wanted = false
  clearTimeout(timer)
  socket?.close()
  socket = null
  useApiStatus.setState({ realtime: "off" })
}
