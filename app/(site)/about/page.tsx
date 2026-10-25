import type { Metadata } from "next"
import Link from "next/link"
import { Bot, Building2, HeartHandshake, Mail, MapPin } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Logo } from "@/components/brand/Logo"
import { Container, JsonLd, PillLink } from "@/components/web/ui"
import { SITE } from "@/components/web/data"

export const metadata: Metadata = {
  title: "About Answerd",
  description: "Answerd is a Vitalos product. Local businesses. Happier customers. A stronger community.",
  alternates: { canonical: "/about" },
}

/** W-21: About. */
export default function Page() {
  return (
    <>
      <ScreenMeta id="W-21" />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "Answerd", url: SITE, parentOrganization: { "@type": "Organization", name: "Vitalos", url: "https://vitalos.co.uk" } }} />
      <section className="border-b border-line bg-white">
        <Container className="py-14 md:py-20">
          <Logo size={40} tagline />
          <h1 className="t-display mt-8 max-w-3xl">Local businesses. Happier customers. A stronger community.</h1>
          <p className="mt-4 max-w-2xl t-body text-slate">
            Answerd is the UK marketplace where every local service business picks up. Customers find, call, message, book and review any local service. Businesses list free and can switch on an AI front desk that answers when they can&apos;t.
          </p>
        </Container>
      </section>
      <Container className="grid gap-5 py-12 md:grid-cols-3 md:py-16">
        <div className="card p-6">
          <Building2 className="size-6 text-blue" aria-hidden />
          <h2 className="mt-4 t-subhead">Answerd by Vitalos</h2>
          <p className="mt-1 t-body text-slate">Answerd is a Vitalos product and lives at answerd.vitalos.co.uk. Your Answerd account is also your Vitalos Workforce login.</p>
        </div>
        <div className="card p-6">
          <Bot className="size-6 text-blue" aria-hidden />
          <h2 className="mt-4 t-subhead">Chat powered by Askbridge</h2>
          <p className="mt-1 t-body text-slate">Ask Answerd and Chat with Answerd are powered by Askbridge, Vitalos&apos;s website assistant. The Answerd desk runs on Workforce. Both always say they&apos;re an AI, and a person can take over in one tap.</p>
        </div>
        <div className="card p-6">
          <HeartHandshake className="size-6 text-blue" aria-hidden />
          <h2 className="mt-4 t-subhead">Fair to businesses</h2>
          <p className="mt-1 t-body text-slate">Listing is free. A business never pays before Answerd has sent it 10 enquiries, and we never sell its customers&apos; details.</p>
        </div>
      </Container>
      <Container className="pb-16">
        <div className="card flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="t-heading">Contact us</h2>
            <ul className="mt-3 space-y-2 t-body text-slate">
              <li className="flex items-center gap-2">
                <Mail className="size-5 text-muted-ink" aria-hidden /> hello@answerd.vitalos.co.uk
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-5 text-muted-ink" aria-hidden /> Vitalos, London, United Kingdom
              </li>
            </ul>
            <p className="mt-3 t-label font-normal text-slate">
              Press or partnerships? Use the{" "}
              <Link href="/help#contact" className="text-blue underline underline-offset-2">
                contact form
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PillLink href="/help#contact">Get in touch</PillLink>
            <PillLink href="/for-businesses" variant="secondary">
              For businesses
            </PillLink>
          </div>
        </div>
        <p className="mt-6 text-center t-caption text-muted-ink">Answerd is a Vitalos product · Powered by Askbridge</p>
      </Container>
    </>
  )
}
