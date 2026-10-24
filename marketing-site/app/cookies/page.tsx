import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LegalSection } from "@/components/site/legal-page"
import { CookieSettingsButton } from "@/components/site/islands"
import { SITE_URL } from "@/content/site"

export const metadata: Metadata = {
  title: "Cookie policy · Answerd",
  description: "The cookies and similar storage the Answerd website uses, and how to change your choice. Placeholder: the final text will come from Vitalos legal.",
  alternates: { canonical: `${SITE_URL}/cookies` },
}

const essential = [
  { name: "Your cookie choice", provider: "Answerd", purpose: "Remembers whether you accepted or rejected non-essential cookies, so we don't ask on every page.", storage: "Browser storage on this site" },
]

const optional = [
  { name: "Askbridge chat", provider: "Askbridge (askbridge.vitalos.co.uk)", purpose: "Loads the Chat with Answerd assistant and remembers your conversation.", storage: "Cookies and browser storage set by Askbridge" },
  { name: "Analytics", provider: "To be confirmed", purpose: "Measures how the site is used (for example which pages are visited) so we can improve it.", storage: "To be confirmed" },
]

function CookieTable({ caption, rows }: { caption: string; rows: typeof essential }) {
  return (
    <>
      {/* Phones: one card per row */}
      <ul className="flex flex-col gap-3 sm:hidden" aria-label={caption}>
        {rows.map((r) => (
          <li key={r.name} className="rounded-2xl border border-line p-4 text-[15px] leading-6">
            <p className="font-semibold text-navy">{r.name}</p>
            <dl className="mt-2 flex flex-col gap-2">
              {(["provider", "purpose", "storage"] as const).map((k) => (
                <div key={k}>
                  <dt className="t-small font-semibold text-navy capitalize">{k}</dt>
                  <dd>{r[k]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-2xl border border-line sm:block">
        <table className="w-full text-left text-[15px] leading-6">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-sky text-navy">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Name</th>
              <th scope="col" className="px-4 py-3 font-semibold">Provider</th>
              <th scope="col" className="px-4 py-3 font-semibold">Purpose</th>
              <th scope="col" className="px-4 py-3 font-semibold">Storage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-line align-top">
                <th scope="row" className="px-4 py-3 font-semibold text-navy">{r.name}</th>
                <td className="px-4 py-3">{r.provider}</td>
                <td className="px-4 py-3">{r.purpose}</td>
                <td className="px-4 py-3">{r.storage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie policy" intro="The cookies and similar storage this website uses, and how to change your choice.">
      <LegalSection id="what" title="What cookies are">
        <p>Cookies and similar technologies, such as browser storage, are small pieces of data a website saves on your device.</p>
      </LegalSection>
      <LegalSection id="essential" title="Essential">
        <p>These make the site work. They are always on and don&apos;t need your consent.</p>
        <CookieTable caption="Essential cookies" rows={essential} />
      </LegalSection>
      <LegalSection id="optional" title="Optional">
        <p>
          These only load if you choose <strong className="font-semibold text-navy">Accept all</strong>. If you reject non-essential cookies,
          nothing from these providers loads and you see a local preview of the chat instead.
        </p>
        <CookieTable caption="Optional cookies" rows={optional} />
      </LegalSection>
      <LegalSection id="settings" title="Change your choice">
        <p>You can change your mind at any time. Changing your settings brings back the cookie choices so you can choose again.</p>
        <CookieSettingsButton />
      </LegalSection>
      <LegalSection id="more" title="More information">
        <p>
          For how we use personal data, see our{" "}
          <Link href="/privacy" className="font-semibold text-blue underline underline-offset-2 hover:text-blue-hover">
            privacy notice
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
