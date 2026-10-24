import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { GetAppButton } from "./get-app"
import { HeaderBar, MobileMenu } from "./header-client"
import { focusRing } from "./focus"
import { site } from "@/content/site"

/**
 * Sticky site header. The layout box is always 64 px tall (plus a 16 px margin that scrolls away), and the
 * visible bar is an absolutely positioned layer whose height eases 80 → 64 with scroll, so the page below
 * never reflows while it compacts. Server-rendered; only the bar's scroll effect and the menu are client code.
 */
export function Header() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-blue font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-5 focus:py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 mb-4 h-16">
        <HeaderBar>
          <div className="container-site flex h-full items-center justify-between gap-6">
            <Link href="/" aria-label="Answerd home" className={`-m-1 rounded-lg p-1 ${focusRing}`}>
              <Logo size={34} />
            </Link>

            <div className="hidden items-center gap-3 md:flex lg:gap-5">
              <nav aria-label="Main">
                <ul className="flex items-center gap-1">
                  {site.nav.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={`inline-flex h-10 items-center rounded-full px-4 text-[15px] font-medium text-navy transition-colors hover:bg-sky hover:text-blue ${focusRing}`}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <GetAppButton icon />
            </div>

            <MobileMenu nav={site.nav} />
          </div>
        </HeaderBar>
      </header>
    </>
  )
}
