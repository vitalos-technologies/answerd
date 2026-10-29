// The /contact form's server side: check the fields, then relay them to the Vitalos admin inbox
// (admin.vitalos.co.uk, the super admin's Enquiries) through its signed web-form endpoint. Web Crypto only, so it
// runs on Workers as well as Node.
//
// Endpoint: POST <VITALOS_ENQUIRY_URL> (default https://admin.vitalos.co.uk/api/inbound/web-form)
//   X-Vitalos-Timestamp: unix seconds
//   X-Vitalos-Signature: lowercase hex HMAC-SHA256 of "<timestamp>.<raw body>" with VITALOS_ENQUIRY_SECRET
// Body: { name, email, company, message, website (honeypot), turnstile_token, client_ip }. 201 { ref } when stored;
// 200 { status: "ok" } when accepted but not stored (honeypot, or over the inbox's hourly limit per address).

export const ENQUIRY_URL_DEFAULT = "https://admin.vitalos.co.uk/api/inbound/web-form"

/** The admin inbox's own limits (superadmin/apps/enquiries/api.py FIELD_LIMITS). */
export const LIMITS = { name: 200, email: 254, company: 200, message: 5000 } as const
/** Room the relay keeps for the "Sent from the Answerd website" line it adds to the message. */
const MESSAGE_HEADER_ROOM = 120
export const MESSAGE_MAX = LIMITS.message - MESSAGE_HEADER_ROOM

export const TOPICS = ["customer", "business", "press", "other"] as const
export type Topic = (typeof TOPICS)[number]

export interface ContactInput {
  topic: Topic
  name: string
  email: string
  company: string
  message: string
  /** Honeypot: people never see it, so anything in it means a bot. */
  website: string
  turnstileToken: string
}

export type FieldErrors = Partial<Record<"topic" | "name" | "email" | "company" | "message", "required" | "tooLong" | "invalid">>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Controls other than tab, newline and carriage return; one-line fields refuse every control character.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
const ANY_CONTROL = /[\u0000-\u001f\u007f]/
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")

/** Parse and check a submission. Returns the clean input, or the errors per field (codes; the page holds the words). */
export function parseContact(raw: unknown): { ok: true; input: ContactInput } | { ok: false; errors: FieldErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const input: ContactInput = {
    topic: (TOPICS as readonly string[]).includes(str(r.topic)) ? (str(r.topic) as Topic) : "other",
    name: str(r.name),
    email: str(r.email),
    company: str(r.company),
    message: str(r.message),
    website: str(r.website),
    turnstileToken: str(r.turnstileToken),
  }
  const errors: FieldErrors = {}
  if (!input.name) errors.name = "required"
  else if ([...input.name].length > LIMITS.name || ANY_CONTROL.test(input.name)) errors.name = [...input.name].length > LIMITS.name ? "tooLong" : "invalid"
  if (!input.email) errors.email = "required"
  else if (input.email.length > LIMITS.email) errors.email = "tooLong"
  else if (!EMAIL.test(input.email) || ANY_CONTROL.test(input.email)) errors.email = "invalid"
  if ([...input.company].length > LIMITS.company) errors.company = "tooLong"
  else if (ANY_CONTROL.test(input.company)) errors.company = "invalid"
  if (!input.message) errors.message = "required"
  else if ([...input.message].length > MESSAGE_MAX) errors.message = "tooLong"
  else if (CONTROL.test(input.message)) errors.message = "invalid"
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, input }
}

const TOPIC_LABEL: Record<Topic, string> = {
  customer: "Customer question",
  business: "Business owner",
  press: "Press or partnerships",
  other: "Something else",
}

/** The body the admin inbox receives: the topic and site go first in the message, so the inbox shows where it came from. */
export function relayBody(input: ContactInput, clientIp: string) {
  return JSON.stringify({
    name: input.name,
    email: input.email,
    company: input.company,
    message: `Sent from the Answerd website contact form (answerd.vitalos.co.uk). Topic: ${TOPIC_LABEL[input.topic]}.\n\n${input.message}`,
    website: input.website,
    turnstile_token: input.turnstileToken,
    client_ip: clientIp,
  })
}

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

/** Lowercase hex HMAC-SHA256 over "<timestamp>.<body>", as the admin inbox verifies it. */
export async function signEnquiry(secret: string, timestamp: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`)))
}

export type RelayResult = { kind: "stored"; ref: string } | { kind: "accepted" } | { kind: "rejected"; status: number; errors?: FieldErrors } | { kind: "unavailable" }

/** Send a checked submission to the admin inbox. Never throws; never logs the body. */
export async function relayEnquiry(input: ContactInput, clientIp: string, env: { url?: string; secret?: string }, fetchImpl: typeof fetch = fetch): Promise<RelayResult> {
  if (!env.secret) return { kind: "unavailable" }
  const body = relayBody(input, clientIp)
  const timestamp = String(Math.floor(Date.now() / 1000))
  let res: Response
  try {
    res = await fetchImpl(env.url || ENQUIRY_URL_DEFAULT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-vitalos-timestamp": timestamp, "x-vitalos-signature": await signEnquiry(env.secret, timestamp, body) },
      body,
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    return { kind: "unavailable" }
  }
  if (res.status === 201) {
    const data = (await res.json().catch(() => ({}))) as { ref?: unknown }
    return typeof data.ref === "string" ? { kind: "stored", ref: data.ref } : { kind: "accepted" }
  }
  if (res.ok) return { kind: "accepted" }
  if (res.status === 400) {
    const data = (await res.json().catch(() => ({}))) as { errors?: Record<string, unknown> }
    const errors: FieldErrors = {}
    for (const k of ["name", "email", "company", "message"] as const) if (data.errors?.[k]) errors[k] = "invalid"
    return { kind: "rejected", status: 400, errors }
  }
  // 401 (signature), 413, 503 (inbox not configured) and 5xx: our side or theirs, never the visitor's fault.
  return { kind: "unavailable" }
}
