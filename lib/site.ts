// The Answerd website is its own project (marketing-site/). The prototype has no website pages of its own: public
// web URLs redirect there (next.config.ts) and the hub links out to it. Set NEXT_PUBLIC_SITE_URL at build time to
// point at another deploy, e.g. https://answerd.vitalos.co.uk.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://answerd-site.descriptive-santanaraptor.workers.dev").replace(/\/$/, "")

/** Prototype web path → the matching page on the website (paths the website doesn't have go to the closest page). */
export const SITE_PATHS: [source: string, destination: string][] = [
  ["/search", "/#popular-services"],
  ["/how-it-works", "/#how-it-works"],
  ["/for-businesses", "/#for-businesses"],
  ["/pricing", "/billing"],
  ["/account", "/get-the-app"],
  ["/legal/terms", "/terms"],
  ["/legal/privacy", "/privacy"],
  ["/legal/cookies", "/cookies"],
  ["/legal/reviews", "/legal/review-policy"],
  ["/b/:slug/book", "/b/:slug"],
  ["/b/:slug", "/b/:slug"],
  ["/areas/:area", "/areas/:area"],
  ["/claim", "/claim"],
  ["/sign-in", "/sign-in"],
  ["/help", "/help"],
  ["/about", "/about"],
  ["/legal/:doc", "/legal/:doc"],
  ["/review/:token", "/review/:token"],
  ["/get-the-app", "/get-the-app"],
]

export function siteUrl(path = "/") {
  return SITE_URL + (path.startsWith("/") ? path : `/${path}`)
}
