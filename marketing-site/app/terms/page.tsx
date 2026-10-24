import type { Metadata } from "next"
import { LegalPage, LegalSection } from "@/components/site/legal-page"
import { SITE_URL } from "@/content/site"

export const metadata: Metadata = {
  title: "Terms of use · Answerd",
  description: "The terms for using the Answerd website and app. Placeholder: the final text will come from Vitalos legal.",
  alternates: { canonical: `${SITE_URL}/terms` },
}

const sections = [
  { title: "About these terms", body: "Who we are (Vitalos Technologies, the company behind Answerd), how to contact us, and when these terms apply." },
  { title: "Using Answerd", body: "What Answerd does: helping you find, contact and book local service businesses. Who can use it and what you agree to when you do." },
  { title: "Your account", body: "Creating an account, keeping your details accurate and secure, and how you can close your account." },
  { title: "Businesses on Answerd", body: "Businesses are independent of Answerd. How listings, verification badges and the AI front desk work, and who is responsible for the work a business carries out." },
  { title: "Bookings and payments", body: "How bookings made through the app work, and how any payments between you and a business are handled." },
  { title: "Reviews", body: "Who can leave a review (customers who booked or called a business), what reviews may contain, and how we handle reviews that break the rules." },
  { title: "Acceptable use", body: "What you mustn't do on Answerd, and what we may do if these terms are broken." },
  { title: "Our liability", body: "The limits of our responsibility, and the rights you always keep under UK consumer law." },
  { title: "Changes to these terms", body: "How and when we'll tell you about changes." },
  { title: "Law and disputes", body: "Which UK law applies and how disputes are resolved." },
]

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" intro="The rules for using the Answerd website and app.">
      {sections.map((s) => (
        <LegalSection key={s.title} title={s.title}>
          <p>{s.body}</p>
        </LegalSection>
      ))}
    </LegalPage>
  )
}
