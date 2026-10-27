// ANSWERD_STAGING_TEST_PHONES: the allowlisted staging numbers, by role. Accepted forms:
//   JSON:   {"customer":"+447700900123","owner":"+447700900456"}
//   Pairs:  customer=+447700900123, owner=+447700900456   (commas, spaces or new lines)
//   A list: +447700900123, +447700900456                   (first is the customer, second the owner)
const ROLES = ["customer", "owner", "staff", "admin"]

export function parsePhones(raw: string | undefined): Record<string, string> {
  const text = (raw ?? "").trim()
  if (!text) return {}
  if (text.startsWith("{")) return JSON.parse(text) as Record<string, string>
  const out: Record<string, string> = {}
  let i = 0
  for (const part of text.split(/[\s,;]+/).filter(Boolean)) {
    const [k, v] = part.includes("=") || part.includes(":") ? part.split(/[=:]/, 2) : [ROLES[i++], part]
    if (k && v) out[k.trim().toLowerCase()] = v.trim()
  }
  return out
}
