// Wakes the staging API before the API-mode run (Render's free tier sleeps after 15 minutes; waking takes about a minute).
export default async function warmUp() {
  const url = process.env.NEXT_PUBLIC_ANSWERD_API_URL
  if (!url) return
  const deadline = Date.now() + 180_000
  for (;;) {
    try {
      const res = await fetch(`${url}/v1/categories`, { signal: AbortSignal.timeout(90_000) })
      if (res.ok) return
    } catch {
      /* still waking */
    }
    if (Date.now() > deadline) throw new Error(`The Answerd API at ${url} didn't wake up within 3 minutes`)
    await new Promise((r) => setTimeout(r, 5_000))
  }
}
