// API mode: relays the API's realtime WebSocket to the browser as Server-Sent Events. The API's /v1/realtime
// refuses any browser Origin except the production website (403), so the demo and localhost can't open it
// directly. The server connects without one, sending the signed-in user's access token as a bearer header (and as
// ?access_token=), and streams each event as `data: <json>`. `event: ready` means the upstream socket is open;
// `event: closed` means it ended, with the reason (the client reconnects with backoff). Off in mock mode.
import { REALTIME_URL } from "@/lib/api/config"

export const dynamic = "force-dynamic"

const HEARTBEAT_MS = 25_000

type WorkersSocket = WebSocket & { accept(): void }

/** Opens the upstream socket. Workers can't pass headers to `new WebSocket`, so there it's fetch with Upgrade. */
async function openUpstream(token: string): Promise<{ ws: WebSocket; open: boolean }> {
  const url = `${REALTIME_URL}?access_token=${encodeURIComponent(token)}`
  const authorization = `Bearer ${token}`
  if ("WebSocketPair" in globalThis) {
    const res = await fetch(url.replace(/^ws/, "http"), { headers: { upgrade: "websocket", authorization } })
    const ws = (res as Response & { webSocket?: WorkersSocket | null }).webSocket
    if (!ws) throw new Error(`upstream ${res.status}`)
    ws.accept()
    return { ws, open: true }
  }
  // Node (next start): its WebSocket takes headers as a non-standard option
  return { ws: new WebSocket(url, { headers: { authorization } } as unknown as string[]), open: false }
}

/** After a failed handshake (Node hides its status): what a plain authenticated GET of the endpoint says. */
async function probe(token: string) {
  try {
    const res = await fetch(`${REALTIME_URL.replace(/^ws/, "http")}?access_token=${encodeURIComponent(token)}`, { headers: { authorization: `Bearer ${token}` } })
    const body = (await res.json().catch(() => null)) as { code?: string } | null
    return `HTTP ${res.status}${body?.code ? ` ${body.code}` : ""}`
  } catch {
    return "unreachable"
  }
}

export function GET(req: Request) {
  if (!REALTIME_URL) return Response.json({ title: "API mode is off" }, { status: 404 })
  const token = new URL(req.url).searchParams.get("access_token")
  if (!token) return Response.json({ title: "Sign in to continue" }, { status: 401 })

  const enc = new TextEncoder()
  let upstream: WebSocket | null = null
  let beat: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let done = false
      const send = (chunk: string) => {
        if (!done) controller.enqueue(enc.encode(chunk))
      }
      const end = (reason: string) => {
        if (done) return
        send(`event: closed\ndata: ${JSON.stringify({ reason })}\n\n`)
        done = true
        clearInterval(beat)
        controller.close()
        upstream?.close()
      }
      beat = setInterval(() => send(": keep-alive\n\n"), HEARTBEAT_MS)
      req.signal.addEventListener("abort", () => end("client gone"))
      let opened: { ws: WebSocket; open: boolean }
      try {
        opened = await openUpstream(token)
      } catch (e) {
        return end(e instanceof Error ? e.message : "upstream error")
      }
      upstream = opened.ws
      if (opened.open) send("event: ready\ndata: {}\n\n")
      else upstream.onopen = () => send("event: ready\ndata: {}\n\n")
      upstream.onmessage = (m) => {
        const text = typeof m.data === "string" ? m.data : ""
        // One SSE event per realtime message; newlines inside JSON are escaped, so one data line is enough
        if (text) send(`data: ${text.replace(/\n/g, " ")}\n\n`)
      }
      upstream.onerror = () => void probe(token).then((p) => end(`upstream refused the socket (${p})`))
      upstream.onclose = (e) => end(`upstream closed ${e.code}${e.reason ? ` ${e.reason}` : ""}`)
    },
    cancel() {
      clearInterval(beat)
      upstream?.close()
    },
  })

  return new Response(stream, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store, no-transform", connection: "keep-alive" },
  })
}
