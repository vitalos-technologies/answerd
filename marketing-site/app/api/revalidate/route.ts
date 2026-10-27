// On-demand ISR: the Answerd API calls this when a listing changes, so its page, and the search, category and
// area pages that show it, regenerate on the next visit instead of waiting for the hourly revalidate.
//
// Signed with ANSWERD_REVALIDATE_SECRET (an env secret the owner sets on the Worker and on the API):
//   x-answerd-timestamp: unix seconds
//   x-answerd-signature: sha256=<hex HMAC-SHA256 of "<timestamp>.<raw body>">
// Body: { "listingSlug"?: string, "listingId"?: string }. Requests older than 5 minutes are rejected.
import { revalidateTag } from "next/cache"
import * as api from "@/lib/api/client"
import { verifySignature } from "@/lib/api/signature"

export async function POST(req: Request) {
  const secret = process.env.ANSWERD_REVALIDATE_SECRET
  if (!secret) return Response.json({ revalidated: false, error: "not configured" }, { status: 503 })
  const body = await req.text()
  const ok = await verifySignature(secret, req.headers.get("x-answerd-timestamp") ?? "", body, req.headers.get("x-answerd-signature") ?? "")
  if (!ok) return Response.json({ revalidated: false, error: "bad signature" }, { status: 401 })

  let input: { listingSlug?: unknown; listingId?: unknown }
  try {
    input = JSON.parse(body)
  } catch {
    return Response.json({ revalidated: false, error: "bad body" }, { status: 400 })
  }
  let slug = typeof input.listingSlug === "string" ? input.listingSlug : undefined
  const id = typeof input.listingId === "string" ? input.listingId : undefined
  if (!slug && id && api.apiEnabled) slug = (await api.call<{ slug: string | null }>(`/v1/listings/${encodeURIComponent(id)}`).catch(() => null))?.slug ?? undefined
  if (!slug && !id) return Response.json({ revalidated: false, error: "listingSlug or listingId required" }, { status: 400 })

  // Expire at once: the next visit renders fresh data.
  const tags = [...(slug ? [api.tags.listing(slug)] : []), ...(id ? [api.tags.listing(id)] : []), api.tags.search]
  for (const t of tags) revalidateTag(t, { expire: 0 })
  return Response.json({ revalidated: true, tags })
}
