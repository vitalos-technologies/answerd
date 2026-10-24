import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { StoreBadges } from "./store-badges"
import { site } from "@/content/site"

// On navy the blue ring falls below 3:1, so footer focus rings are white.
const link =
  "rounded-sm text-white/80 transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a href={href} className={link}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={link}>
      {children}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="bg-navy pt-16 pb-[calc(152px+env(safe-area-inset-bottom))] text-white md:pt-20 md:pb-24">
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="flex flex-col items-start gap-8">
            <Link href="/" aria-label="Answerd home" className="-m-1 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <Logo variant="reversed" layout="horizontal" tagline size={36} />
            </Link>
            <StoreBadges size="sm" className="[&_a]:focus-visible:outline-white" />
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {site.footer.columns.map((col) => (
              <div key={col.title}>
                <h2 className="text-sm font-semibold tracking-[0.06em] text-white uppercase">{col.title}</h2>
                <ul className="mt-4 flex flex-col gap-3 text-[15px] leading-6">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <FooterLink href={l.href}>{l.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 border-t border-white/15 pt-6 md:mt-16">
          <p className="t-small text-white/80">{site.footer.bottom}</p>
        </div>
      </div>
    </footer>
  )
}
