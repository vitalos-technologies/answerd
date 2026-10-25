"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { SearchBar } from "@/components/answerd/Search"
import { useStore, useCurrentUser } from "@/lib/store"
import { cn } from "@/lib/utils"
import { LEAF_CATEGORIES } from "@/lib/categories"
import { membershipsFor } from "@/lib/selectors"

const NAV = [
  { href: "/search", label: "Find a business" },
  { href: "/for-businesses", label: "List your business" },
  { href: "/how-it-works", label: "How it works" },
]

/** Logo, Find a business, List your business, How it works, Sign in; compacts on scroll and shows the search bar. */
export function WebHeader() {
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const router = useRouter()
  const pathname = usePathname()
  const user = useCurrentUser()
  const s = useStore()
  const isBiz = membershipsFor(s, s.session.userId).length > 0
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 80)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  const [menuPath, setMenuPath] = React.useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setOpen(false)
  }

  return (
    <header className={cn("sticky top-0 z-40 border-b transition-[background-color,box-shadow] duration-150", scrolled ? "border-line bg-white/95 shadow-card backdrop-blur" : "border-transparent bg-white")}>
      <div className={cn("mx-auto flex max-w-[1200px] items-center gap-4 px-6 transition-[height] duration-150 max-sm:px-4", scrolled ? "h-16" : "h-20")}>
        <Link href="/" aria-label="Answerd home" className="shrink-0">
          <Logo size={scrolled ? 28 : 34} />
        </Link>
        {scrolled && (
          <SearchBar className="hidden h-11 max-w-md lg:flex" value={q} onChange={setQ} onSubmit={(v) => router.push(`/search?q=${encodeURIComponent(v)}`)} submitButton />
        )}
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("rounded-full px-3.5 py-2 t-label text-navy hover:bg-blue-tint", pathname === n.href && "text-blue")}>
              {n.label}
            </Link>
          ))}
          {user ? (
            <Link href={isBiz ? "/dashboard" : "/account"} className="ml-2 inline-flex h-11 items-center rounded-full bg-blue px-5 t-label font-semibold text-white hover:bg-blue-hover">
              {isBiz ? "Dashboard" : `Hi, ${user.firstName}`}
            </Link>
          ) : (
            <Link href="/sign-in" className="ml-2 inline-flex h-11 items-center rounded-full bg-blue px-5 t-label font-semibold text-white hover:bg-blue-hover">
              Sign in
            </Link>
          )}
        </nav>
        <button type="button" className="ml-auto inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-line bg-white px-4 py-3 md:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="flex h-12 items-center rounded-xl px-3 t-label text-navy hover:bg-sky">
              {n.label}
            </Link>
          ))}
          <Link href={user ? (isBiz ? "/dashboard" : "/account") : "/sign-in"} className="mt-2 flex h-12 items-center justify-center rounded-full bg-blue t-label font-semibold text-white">
            {user ? (isBiz ? "Dashboard" : "Your account") : "Sign in"}
          </Link>
        </nav>
      )}
    </header>
  )
}

const CITIES = [
  { slug: "croydon", name: "Croydon" },
  { slug: "south-norwood", name: "South Norwood" },
  { slug: "upper-norwood", name: "Upper Norwood" },
  { slug: "birmingham", name: "Birmingham" },
  { slug: "manchester", name: "Manchester" },
]

export function WebFooter() {
  const cats = LEAF_CATEGORIES.slice(0, 12)
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-14 max-sm:px-4 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo variant="reversed" layout="horizontal" size={30} tagline />
          <p className="mt-5 max-w-xs t-label font-normal text-white/80">Local businesses. Happier customers. A stronger community.</p>
        </div>
        <div>
          <h2 className="t-label font-semibold text-white">Popular services</h2>
          <ul className="mt-3 grid gap-1.5">
            {cats.map((c) => (
              <li key={c.id}>
                <Link href={`/${c.slug}`} className="t-label font-normal text-white/80 hover:text-white hover:underline">
                  {c.plural}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="t-label font-semibold text-white">Areas</h2>
          <ul className="mt-3 grid gap-1.5">
            {CITIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/areas/${c.slug}`} className="t-label font-normal text-white/80 hover:text-white hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/plumbers/croydon" className="t-label font-normal text-white/80 hover:text-white hover:underline">
                Plumbers in Croydon
              </Link>
            </li>
            <li>
              <Link href="/cleaners/manchester" className="t-label font-normal text-white/80 hover:text-white hover:underline">
                Cleaners in Manchester
              </Link>
            </li>
            <li>
              <Link href="/barbers/birmingham" className="t-label font-normal text-white/80 hover:text-white hover:underline">
                Barbers in Birmingham
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="t-label font-semibold text-white">Answerd</h2>
          <ul className="mt-3 grid gap-1.5">
            {[
              ["/about", "About"],
              ["/how-it-works", "How it works"],
              ["/for-businesses", "For businesses"],
              ["/pricing", "Pricing"],
              ["/help", "Help centre"],
              ["/get-the-app", "Get the app"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href!} className="t-label font-normal text-white/80 hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-2 px-6 py-5 t-caption text-white/80 max-sm:px-4">
          {[
            ["/legal/terms", "Terms"],
            ["/legal/privacy", "Privacy notice"],
            ["/legal/cookies", "Cookies"],
            ["/legal/reviews", "Review policy"],
            ["/legal/acceptable-use", "Acceptable use"],
            ["/legal/call-recording", "Call recording"],
          ].map(([href, label]) => (
            <Link key={href} href={href!} className="hover:text-white hover:underline">
              {label}
            </Link>
          ))}
          <span className="ml-auto">Answerd is a Vitalos product · Powered by Askbridge</span>
        </div>
      </div>
    </footer>
  )
}
