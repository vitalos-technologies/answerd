// API mode: relays the API's realtime WebSocket to the browser as Server-Sent Events. The API's /v1/realtime
// refuses any browser Origin except the production website (403), so the demo and localhost can't open it
// directly. The server connects without one, using the signed-in user's access token, and streams each event as
// `data: <json>`. `event: ready` means the upstream socket is open; `event: closed` means it ended (the client
// reconnects with backoff). Off in mock mode.
import { REALTIME_URL } from "@/lib/api/config"

export const dynamic = "force-dynamic"

const HEARTBEAT_MS = 25_000

export function GET(req: Request) {
  if (!REALTIME_URL) return Response.json({ title: "API mode is off" }, { status: 404 })
  const token = new URL(req.url).searchParams.get("access_token")
  if (!token) return Response.json({ title: "Sign in to continue" }, { status: 401 })

  const enc = new TextEncoder()
  let upstream: WebSocket | null = null
  let beat: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
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
      upstream = new WebSocket(`${REALTIME_URL}?access_token=${encodeURIComponent(token)}`)
      upstream.onopen = () => send("event: ready\ndata: {}\n\n")
      upstream.onmessage = (m) => {
        const text = typeof m.data === "string" ? m.data : ""
        // One SSE event per realtime message; newlines inside JSON are escaped, so one data line is enough
        if (text) send(`data: ${text.replace(/\n/g, " ")}\n\n`)
      }
      upstream.onerror = () => end("upstream error")
      upstream.onclose = (e) => end(`upstream closed ${e.code}`)
      beat = setInterval(() => send(": keep-alive\n\n"), HEARTBEAT_MS)
      req.signal.addEventListener("abort", () => end("client gone"))
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
