// W-20 help centre: 20 seeded articles, 10 for customers and 10 for businesses.
export interface HelpArticle {
  slug: string
  audience: "customers" | "businesses"
  title: string
  body: string[]
  keywords: string
}

export const HELP_ARTICLES: HelpArticle[] = [
  { slug: "how-to-book", audience: "customers", title: "How do I book a business?", keywords: "book booking appointment slot", body: ["Open the business, tap Book, choose a service and a time from their diary, then add your address and confirm.", "Instant booking confirms straight away. Request to book means the business confirms within 2 hours; if they don't, the request expires and we suggest others free at that time."] },
  { slug: "cancel-or-reschedule", audience: "customers", title: "Cancelling or changing a booking", keywords: "cancel reschedule change time refund", body: ["Open the booking and choose Reschedule or Cancel.", "Most businesses let you cancel free until 24 hours before. The policy is shown before you confirm and again on the booking."] },
  { slug: "answerd-numbers", audience: "customers", title: "Why do calls go through an Answerd number?", keywords: "call phone number tracked privacy", body: ["Calls go through an Answerd number so the business knows you found them here. It also lets you review after a call of more than a minute.", "Your own number is only shared with the business you call."] },
  { slug: "what-is-the-desk", audience: "customers", title: "Who is the Answerd desk?", keywords: "ai desk assistant bot robot", body: ["Some businesses use the Answerd desk, an AI assistant, to answer when they're busy.", "It always says it's an AI, every message it sends is labelled “Answerd desk”, and it can hand you to the owner at any time."] },
  { slug: "leaving-a-review", audience: "customers", title: "Leaving a review", keywords: "review rating stars feedback", body: ["After a completed booking we send one review request with a link. You can also review after a tracked call of more than a minute.", "Reviews must follow our review policy. Businesses can reply once, publicly."] },
  { slug: "review-link-expired", audience: "customers", title: "My review link has expired", keywords: "review link expired token", body: ["Review links work for 30 days after the job. Sign in and open the booking from your account to review it there."] },
  { slug: "ask-answerd", audience: "customers", title: "Using Chat with Answerd", keywords: "ask answerd chat help find", body: ["Not sure who you need? Describe the job in Chat with Answerd and it will ask up to two questions, then suggest up to three businesses and say why each fits.", "Guests get 5 messages; sign in to keep chatting. It never books for you without you tapping Book."] },
  { slug: "safety", audience: "customers", title: "Gas leaks and emergencies", keywords: "gas emergency leak flood sparks 999", body: ["If you smell gas, leave the property and call the National Gas Emergency Service on 0800 111 999. If anyone is in danger, call 999. For a power cut, call 105.", "Answerd and the desk always give this advice before anything else."] },
  { slug: "account-and-data", audience: "customers", title: "Your account and data", keywords: "account delete data download privacy", body: ["You can download your data or delete your account from Privacy and data in the app. Deleting cancels any future bookings with notice to the business.", "Read the privacy notice for what we keep and why."] },
  { slug: "report-a-problem", audience: "customers", title: "Reporting a business or review", keywords: "report fake spam wrong closed", body: ["Use Report on a listing or review: wrong information, closed, fake, offensive or a safety concern. Our team reviews every report."] },
  { slug: "claim-your-listing", audience: "businesses", title: "Claiming your listing", keywords: "claim listing verify owner", body: ["Search for your business at answerd.vitalos.co.uk/claim. If it's there, choose Yes, claim it; if not, add it.", "Verify with a code to your listed number, a call, a Companies House director check (limited companies) or a document."] },
  { slug: "verification-documents", audience: "businesses", title: "Which documents prove ownership?", keywords: "document verify utility bill bank hmrc insurance", body: ["A utility bill, bank letter, insurance schedule or HMRC letter in the business name and address. We check it within 1 working day."] },
  { slug: "someone-claimed-my-business", audience: "businesses", title: "Someone else has claimed my business", keywords: "dispute claim taken stolen", body: ["Choose Dispute this claim and tell us why it's yours, with a supporting document if you have one. Our team checks within 1 working day."] },
  { slug: "desk-setup", audience: "businesses", title: "Setting up the AI desk", keywords: "desk setup forwarding number trial", body: ["Start a 14-day free trial, then forward missed calls from your mobile to your Answerd number. We show the codes for EE, O2, Vodafone and Three.", "Choose a greeting and voice, what the desk may do, and when it must hand over to you."] },
  { slug: "desk-handoff", audience: "businesses", title: "When does the desk hand over to me?", keywords: "handoff rules emergency complaint price", body: ["Always for emergencies, complaints, price negotiation and when a caller asks for you by name. You set quiet hours and who gets the alert."] },
  { slug: "monetise-gate", audience: "businesses", title: "When will I pay?", keywords: "price billing pay gate enquiries", body: ["Listing is free. You'll never pay before you've had 10 enquiries from Answerd. The AI desk is £49/month and Featured £29/month, both ex VAT."] },
  { slug: "booking-settings", audience: "businesses", title: "Instant booking or request to book", keywords: "booking settings instant request policy", body: ["Instant booking confirms customers straight away. Request to book gives you 2 hours to accept, decline or suggest another time.", "Set your cancellation policy and reminders in Booking settings."] },
  { slug: "credentials", audience: "businesses", title: "Adding Gas Safe, NICEIC or insurance", keywords: "credentials gas safe niceic napit insurance dbs badge", body: ["Add the registration number and upload the certificate. Once checked, the badge shows on your listing. We'll remind you 30 days before it expires."] },
  { slug: "staff", audience: "businesses", title: "Inviting staff", keywords: "team staff invite", body: ["Invite staff by name and mobile. They see Today, Inbox and Diary for their own jobs and can pause the desk, but can't change billing or your profile."] },
  { slug: "replying-to-reviews", audience: "businesses", title: "Replying to reviews", keywords: "reply review respond", body: ["You can post one public reply to each review. Keep it polite; if a review breaks our policy, report it instead."] },
]

export function searchArticles(q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return HELP_ARTICLES
  const words = t.split(/\s+/)
  return HELP_ARTICLES.filter((a) => {
    const hay = `${a.title} ${a.keywords} ${a.body.join(" ")}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })
}
