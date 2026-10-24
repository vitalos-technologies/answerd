import { SITE_URL, site } from "@/content/site"

const ORG_URL = "https://vitalos.co.uk"

/** Structured data for the home page: the company (with Answerd as its brand) and the app. No ratings: not launched. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${ORG_URL}/#organization`,
      name: "Vitalos Technologies",
      url: ORG_URL,
      brand: {
        "@type": "Brand",
        "@id": `${SITE_URL}/#brand`,
        name: site.name,
        slogan: site.tagline,
        url: SITE_URL,
      },
    },
    {
      "@type": "MobileApplication",
      "@id": `${SITE_URL}/#app`,
      name: site.name,
      url: SITE_URL,
      description: site.description,
      operatingSystem: "iOS, Android",
      applicationCategory: "LifestyleApplication",
      inLanguage: "en-GB",
      areaServed: { "@type": "Country", name: "United Kingdom" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
      publisher: { "@id": `${ORG_URL}/#organization` },
      brand: { "@id": `${SITE_URL}/#brand` },
    },
  ],
}

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so no string in the payload can close the script tag (per the Next.js JSON-LD guide).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  )
}
