// API mode: a same-origin pass-through to the Answerd API for the prototype's browser code. The API's CORS
// allows the production website only, so the demo (and localhost) call it through here. Only /v1/* is
// forwarded, nothing is cached, and only the headers the API needs are passed on. Off in mock mode.
import { API_URL } from "@/lib/api/config"

const FORWARD_REQUEST = ["authorization", "content-type", "accept", "idempotency-key"]
const FORWARD_RESPONSE = ["content-type", "retry-after", "x-request-id", "idempotent-replayed"]

async function proxy(req: Request, ctx: RouteContext<"/api/answerd/[...path]">) {
  if (!API_URL) return Response.json({ title: "API mode is off" }, { status: 404 })
  const { path } = await ctx.params
  if (path[0] !== "v1" || path.some((p) => p === ".." || p === "")) return Response.json({ title: "Not found" }, { status: 404 })
  const target = new URL(`${API_URL}/${path.map(encodeURIComponent).join("/")}`)
  target.search = new URL(req.url).search
  const headers = new Headers()
  for (const h of FORWARD_REQUEST) {
    const v = req.headers.get(h)
    if (v) headers.set(h, v)
  }
  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
    cache: "no-store",
    signal: AbortSignal.timeout(100_000),
  })
  const out = new Headers({ "cache-control": "no-store" })
  for (const h of FORWARD_RESPONSE) {
    const v = res.headers.get(h)
    if (v) out.set(h, v)
  }
  return new Response(res.status === 204 ? null : await res.arrayBuffer(), { status: res.status, headers: out })
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE }
