// W-22 legal pages ported from the prototype (components/web/legal.ts). Terms, privacy and cookies keep their own
// pages (app/terms, app/privacy, app/cookies); these three render at /legal/[slug]. Placeholder text throughout:
// the real policies come from Vitalos legal before launch.
export interface LegalDoc {
  slug: string
  title: string
  summary: string
  sections: { heading: string; body: string }[]
}

const P = "Placeholder: the final wording will come from Vitalos legal before launch."

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "review-policy",
    title: "Review policy",
    summary: "Who can review, what's allowed and how we moderate.",
    sections: [
      { heading: "Who can review", body: `Customers with a completed booking or a tracked call of more than 60 seconds. One review per booking. ${P}` },
      { heading: "What's allowed", body: `Honest, first-hand experiences. No abuse, personal data, conflicts of interest or paid reviews. ${P}` },
      { heading: "Business replies", body: `One public reply per review. ${P}` },
      { heading: "Reporting and removal", body: `Anyone can report a review. Our team keeps or removes it against this policy and records the reason. ${P}` },
    ],
  },
  {
    slug: "acceptable-use",
    title: "Acceptable use policy",
    summary: "What you may not do on Answerd.",
    sections: [
      { heading: "Be honest", body: `No fake listings, impersonation or misleading prices. ${P}` },
      { heading: "Be respectful", body: `No harassment, hate or threats in messages, calls or reviews. ${P}` },
      { heading: "No spam or misuse", body: `No sales calls through Answerd numbers, scraping or attempts to break the service. ${P}` },
      { heading: "What we do", body: `We may remove content, suspend accounts or listings, and report illegal activity. ${P}` },
    ],
  },
  {
    slug: "call-recording",
    title: "Desk call-recording notice",
    summary: "How the Answerd desk records and uses calls.",
    sections: [
      { heading: "When calls are recorded", body: `Calls answered by the Answerd desk are recorded. The desk says so at the start of every call and says it is an AI. ${P}` },
      { heading: "Why", body: `So the business can see what was agreed, for quality checks and to resolve disputes. ${P}` },
      { heading: "Transcripts and summaries", body: `Each call gets a transcript and a short summary for the business. ${P}` },
      { heading: "Retention and access", body: `How long recordings are kept and how to ask for a copy or deletion. ${P}` },
    ],
  },
]

export function legalDoc(slug: string) {
  return LEGAL_DOCS.find((d) => d.slug === slug)
}

/** All six documents, for the legal navigation and the footer. */
export const LEGAL_NAV = [
  { title: "Terms of use", href: "/terms" },
  { title: "Privacy notice", href: "/privacy" },
  { title: "Cookie policy", href: "/cookies" },
  ...LEGAL_DOCS.map((d) => ({ title: d.title, href: `/legal/${d.slug}` })),
]
