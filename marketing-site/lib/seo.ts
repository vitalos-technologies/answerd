import type { Metadata } from "next"
import { SITE_URL, site } from "@/content/site"

/**
 * Per-page metadata: title, description, canonical URL on answerd.vitalos.co.uk and a complete Open Graph
 * block (Next replaces openGraph wholesale, so the shared fields are repeated here).
 */
export function pageMeta({ title, description, path, noindex }: { title: string; description?: string; path: string; noindex?: boolean }): Metadata {
  const url = `${SITE_URL}${path}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, siteName: site.name, locale: "en_GB", title, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  }
}
