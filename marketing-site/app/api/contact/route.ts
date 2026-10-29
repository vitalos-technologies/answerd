// The /contact form posts here; this relays it, signed, to the Vitalos admin inbox (lib/enquiry.ts).
// Env (runtime, on the Worker): VITALOS_ENQUIRY_SECRET (secret, the admin's INBOUND_WEBHOOK_SECRET) and optionally
// VITALOS_ENQUIRY_URL. Without the secret the form says it can't send and shows the email address instead.
import { SITE_URL } from "@/content/site"
import { parseContact, relayEnquiry } from "@/lib/enquiry"

const MAX_BODY_BYTES = 32 * 1024

/** Browser form posts only: the Origin must be this site (or the host serving this request, for previews). */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin")
  if (!origin || !URL.canParse(origin)) return false
  const o = new URL(origin)
  if (o.origin === new URL(SITE_URL).origin) return true
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  return host !== null && o.host === host.split(",")[0]!.trim()
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "forbidden" }, { status: 403 })
  const text = await req.text()
  if (text.length > MAX_BODY_BYTES) return Response.json({ error: "tooLarge" }, { status: 413 })
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return Response.json({ error: "badRequest" }, { status: 400 })
  }
  const parsed = parseContact(raw)
  if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 400 })

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? ""
  const result = await relayEnquiry(parsed.input, ip, { url: process.env.VITALOS_ENQUIRY_URL, secret: process.env.VITALOS_ENQUIRY_SECRET })
  switch (result.kind) {
    case "stored":
      return Response.json({ ref: result.ref }, { status: 201 })
    case "accepted":
      return Response.json({ ok: true })
    case "rejected":
      return Response.json({ errors: result.errors ?? {} }, { status: 400 })
    case "unavailable":
      return Response.json({ error: "unavailable" }, { status: 503 })
  }
}
