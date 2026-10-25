import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { LegalPage, LegalSection } from "@/components/site/legal-page"

export const metadata: Metadata = pageMeta({ title: "Privacy notice · Answerd", description: "How Answerd collects, uses and protects your personal data. Placeholder: the final text will come from Vitalos legal.", path: "/privacy" })

const sections = [
  { title: "Who we are", body: "Vitalos Technologies is the controller of your personal data for Answerd. Contact details, including for data protection questions, will go here." },
  { title: "What we collect", body: "The information you give us (such as your account details and messages), information collected when you use Answerd (such as your approximate location for nearby results), and information from businesses you contact." },
  { title: "How we use it", body: "To show you local businesses, connect your calls, messages and bookings, check reviews come from real bookings, keep Answerd safe, and improve the service." },
  { title: "Our lawful bases", body: "The UK GDPR lawful basis for each use, such as contract, legitimate interests or consent." },
  { title: "Who we share it with", body: "The businesses you choose to contact or book, our service providers (including Askbridge for chat), and anyone we're legally required to share it with." },
  { title: "AI front desk and chat", body: "How conversations with an AI front desk or the Answerd chat are handled, stored and passed to the business." },
  { title: "How long we keep it", body: "Retention periods for each type of data." },
  { title: "International transfers", body: "Whether data leaves the UK and the safeguards in place if it does." },
  { title: "Your rights", body: "Your rights to access, correct, delete, restrict, object to and move your data, and how to complain to the Information Commissioner's Office (ICO)." },
  { title: "Changes to this notice", body: "How we'll tell you about changes." },
]

export default function PrivacyPage() {
  return (
    <LegalPage href="/privacy" title="Privacy notice" intro="How Answerd collects, uses and protects your personal data.">
      {sections.map((s) => (
        <LegalSection key={s.title} title={s.title}>
          <p>{s.body}</p>
        </LegalSection>
      ))}
    </LegalPage>
  )
}
