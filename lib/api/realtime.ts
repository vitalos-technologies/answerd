"use client"
// API mode realtime while signed in. The API's /v1/realtime WebSocket refuses browser Origins other than the
// production website, so the browser listens to the prototype's own relay (app/api/answerd/realtime) over
// Server-Sent Events; the relay holds the WebSocket. Reconnects with backoff (staging may be waking up) and hands
// each event to the bridge.
import { PROXY_BASE, REALTIME_URL } from "./config"
import { getSession } from "./session"
import { useApiStatus } from "./status"
import { call } from "./client"

export interface RealtimeEvent {
  type: string
  data?: Record<string, unknown>
  [k: string]: unknown
}

let source: EventSource | null = null
let retry = 0
let timer: ReturnType<typeof setTimeout> | undefined
let wanted = false

export function connectRealtime(onEvent: (e: RealtimeEvent) => void) {
  wanted = true
  const s = getSession()
  if (!REALTIME_URL || !s || source) return
  useApiStatus.setState({ realtime: "connecting" })
  // Same origin: the token only travels to this prototype's own relay
  const es = new EventSource(`${PROXY_BASE}/realtime?access_token=${encodeURIComponent(s.accessToken)}`)
  source = es
  const reconnect = () => {
    es.close()
    source = null
    useApiStatus.setState({ realtime: "closed" })
    if (!wanted) return
    const delay = Math.min(30_000, 1_000 * 2 ** retry++)
    // An authenticated call first: it refreshes the access token if it has expired
    timer = setTimeout(() => void call("/v1/me").catch(() => undefined).finally(() => connectRealtime(onEvent)), delay)
  }
  es.addEventListener("ready", () => {
    retry = 0
    useApiStatus.setState({ realtime: "open" })
  })
  es.addEventListener("closed", reconnect)
  es.onerror = reconnect
  es.onmessage = (m) => {
    try {
      const e = JSON.parse(String(m.data)) as RealtimeEvent
      if (e && typeof e.type === "string") onEvent(e)
    } catch {
      /* not JSON: ignore */
    }
  }
}

export function disconnectRealtime() {
  wanted = false
  clearTimeout(timer)
  source?.close()
  source = null
  useApiStatus.setState({ realtime: "off" })
}
