"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Bot, CalendarDays, CreditCard, Inbox, LayoutDashboard, Settings, Star, Store, Users, ChevronDown, ExternalLink } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { useStore, useCurrentBusiness, useCurrentUser } from "@/lib/store"
import { membershipsFor, roleIn } from "@/lib/selectors"
import { PersonAvatar } from "@/components/answerd/Media"
import { cn } from "@/lib/utils"
import { OfflineBanner, Toaster } from "@/components/answerd/Feedback"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/diary", label: "Diary", icon: CalendarDays },
  { href: "/dashboard/profile", label: "Profile", icon: Store },
  { href: "/dashboard/desk", label: "AI desk", icon: Bot },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/stats", label: "Stats", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

/** White 240 px sidebar, top bar with business switcher and avatar. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const s = useStore()
  const biz = useCurrentBusiness()
  const user = useCurrentUser()
  const offline = useStore((x) => x.offline)
  const listing = s.listings.find((l) => l.id === biz?.listingId)
  const mems = membershipsFor(s, s.session.userId)
  // Staff see what the app lets staff see: Overview (Today), Inbox and Diary
  const staff = roleIn(s, s.session.userId, biz?.id ?? null) === "staff"
  const nav = staff ? NAV.filter((n) => ["/dashboard", "/dashboard/inbox", "/dashboard/diary"].includes(n.href)) : NAV
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href))

  return (
    <div className="flex min-h-dvh bg-sky">
      <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-line bg-white lg:flex">
        <Link href="/" className="flex h-16 items-center px-5" aria-label="Answerd home">
          <Logo size={28} />
        </Link>
        <nav className="flex-1 space-y-0.5 px-3 py-2" aria-label="Dashboard">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cn("flex h-11 items-center gap-3 rounded-xl px-3 t-label", isActive(n.href) ? "bg-blue-tint text-blue" : "text-slate hover:bg-sky hover:text-navy")}
            >
              <n.icon className="size-5" aria-hidden />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line p-4 t-caption text-muted-ink">Powered by AskBridge</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white px-6">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-11 items-center gap-2 rounded-xl px-3 t-subhead hover:bg-sky" aria-label={`${listing?.name ?? "No business yet"}, switch business`}>
              {listing?.name ?? "No business yet"}
              <ChevronDown className="size-4 text-muted-ink" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-64">
              <DropdownMenuLabel>Your businesses</DropdownMenuLabel>
              {mems.map((m) => {
                const l = s.listings.find((x) => x.businessId === m.businessId)
                return (
                  <DropdownMenuItem key={m.id} onSelect={() => s.setMode("business", m.businessId)}>
                    {l?.name} <span className="ml-auto text-xs text-muted-ink capitalize">{m.role}</span>
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push("/claim")}>Claim or add another business</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {listing && (
            <Link href={`/b/${listing.slug}`} className="hidden items-center gap-1 t-label text-blue hover:underline md:inline-flex">
              View public listing <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          )}
          <div className="ml-auto flex items-center gap-3">
            <Link href="/app/biz" className="hidden t-label text-slate hover:text-navy md:inline">
              Open in the app
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full">
                <span className="sr-only">Account menu</span>
                <span aria-hidden>
                  <PersonAvatar name={user ? `${user.firstName} ${user.lastName}` : "Guest"} size={36} tone="navy" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user ? `${user.firstName} ${user.lastName}` : "Not signed in"}</DropdownMenuLabel>
                {!staff && <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")}>Settings</DropdownMenuItem>}
                <DropdownMenuItem
                  onSelect={() => {
                    s.signOut()
                    router.push("/sign-in")
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-line bg-white px-4 py-2 lg:hidden" aria-label="Dashboard sections">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={cn("inline-flex h-11 shrink-0 items-center rounded-full px-3 t-label", isActive(n.href) ? "bg-blue-tint text-blue" : "text-slate")}>
              {n.label}
            </Link>
          ))}
        </nav>
        {offline && <OfflineBanner />}
        <main className="flex-1 p-6 max-sm:p-4">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
