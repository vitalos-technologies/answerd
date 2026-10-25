// W-22 legal pages. Clearly marked placeholder text: real policies come from Vitalos legal before launch.
export interface LegalDoc {
  slug: string
  title: string
  summary: string
  sections: { heading: string; body: string }[]
}

const P = "Placeholder text for the prototype. The final wording will be provided by Vitalos legal before launch."

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms of use",
    summary: "The agreement between you and Vitalos when you use Answerd.",
    sections: [
      { heading: "Who we are", body: `Answerd is a Vitalos product at answerd.vitalos.co.uk. ${P}` },
      { heading: "Using Answerd", body: `How customers and businesses may use the service, and what you agree to when you sign in. ${P}` },
      { heading: "Bookings and payments", body: `Answerd introduces you to businesses. Contracts for jobs are between you and the business, and you pay them directly. ${P}` },
      { heading: "Business accounts", body: `Claiming a listing, verification, the AI desk, Featured and billing terms. ${P}` },
      { heading: "Liability", body: P },
      { heading: "Changes and contact", body: P },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy notice",
    summary: "What personal data we collect, why, and your rights under UK GDPR.",
    sections: [
      { heading: "What we collect", body: `Account details, bookings, messages, tracked calls and reviews. ${P}` },
      { heading: "Why we use it", body: `To run the marketplace, connect you with businesses and keep Answerd safe. ${P}` },
      { heading: "Who we share it with", body: `The businesses you contact, our processors (including Askbridge for the chat assistant and Workforce for the AI desk) and no one else for marketing. ${P}` },
      { heading: "How long we keep it", body: P },
      { heading: "Your rights", body: `Access, correction, deletion, objection and portability. Download or delete your data from Privacy and data in the app. ${P}` },
      { heading: "Contact and complaints", body: `Contact our data protection lead or the Information Commissioner's Office. ${P}` },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie policy",
    summary: "The cookies Answerd uses and how to change your choice.",
    sections: [
      { heading: "Essential cookies", body: `Keep you signed in, remember your cookie choice and protect against fraud. Always on. ${P}` },
      { heading: "Analytics cookies", body: `Only with your consent. Nothing non-essential runs before you choose. ${P}` },
      { heading: "Marketing cookies", body: `Only with your consent. ${P}` },
      { heading: "Changing your choice", body: `Use Manage in the cookie banner. In this prototype, Reset demo data in the hub shows the banner again. ${P}` },
    ],
  },
  {
    slug: "reviews",
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
