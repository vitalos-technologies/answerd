"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  ClipboardList,
  CreditCard,
  Database,
  FileCheck,
  Flag,
  Gauge,
  Grid3x3,
  KeyRound,
  LayoutDashboard,
  ListTree,
  Megaphone,
  ScrollText,
  Settings,
  Star,
  Store,
  Users,
  UserCog,
} from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { useStore, useCurrentUser } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/answerd/Feedback"

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, id: "A-02" },
  { href: "/admin/listings", label: "Listings", icon: Store, id: "A-03" },
  { href: "/admin/claims", label: "Claims", icon: KeyRound, id: "A-06" },
  { href: "/admin/credentials", label: "Credentials", icon: FileCheck, id: "A-07" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, id: "A-08" },
  { href: "/admin/reports", label: "Reports", icon: Flag, id: "A-09" },
  { href: "/admin/customers", label: "Customers", icon: Users, id: "A-10" },
  { href: "/admin/businesses", label: "Businesses", icon: Building2, id: "A-11" },
  { href: "/admin/desk-qa", label: "Desk QA", icon: Bot, id: "A-12" },
  { href: "/admin/imports", label: "Imports", icon: Database, id: "A-13" },
  { href: "/admin/coverage", label: "Coverage", icon: Grid3x3, id: "A-14" },
  { href: "/admin/taxonomy", label: "Taxonomy", icon: ListTree, id: "A-15" },
  { href: "/admin/places", label: "Places spend", icon: BarChart3, id: "A-16" },
  { href: "/admin/billing", label: "Billing", icon: CreditCard, id: "A-17" },
  { href: "/admin/gate", label: "Monetise gate", icon: Gauge, id: "A-18" },
  { href: "/admin/featured", label: "Featured slots", icon: Megaphone, id: "A-19" },
  { href: "/admin/content", label: "Content", icon: BookOpen, id: "A-20" },
  { href: "/admin/users", label: "Admin users", icon: UserCog, id: "A-21" },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, id: "A-22" },
  { href: "/admin/settings", label: "Settings", icon: Settings, id: "A-23" },
]

/** Navy sidebar, white canvas, dense tables, a role pill. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const user = useCurrentUser()
  const role = user?.staffRole
  if (pathname === "/admin/sign-in") return <>{children}</>
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href))
  return (
    <div className="flex min-h-dvh bg-white">
      <aside className="sticky top-0 flex h-dvh w-[232px] shrink-0 flex-col bg-navy text-white">
        <Link href="/admin" className="flex h-16 items-center gap-2 px-5" aria-label="Answerd admin overview">
          <Logo variant="reversed" layout="horizontal" size={26} />
        </Link>
        <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Admin">
          {ADMIN_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cn("flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium", isActive(n.href) ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white")}
            >
              <n.icon className="size-4" aria-hidden />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/15 p-4 text-[12px] text-white/75">
          <ClipboardList className="mr-1 inline size-3.5" aria-hidden /> Every write is audited
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-6">
          <p className="t-label text-navy">Answerd admin</p>
          <div className="ml-auto flex items-center gap-3">
            {role && (
              <span className={cn("rounded-full px-2.5 py-0.5 t-caption", role === "admin" ? "bg-navy text-white" : "bg-amber-tint text-amber-ink")}>{role === "admin" ? "Admin" : "Support"}</span>
            )}
            <span className="t-label font-normal text-slate">{user ? `${user.firstName} ${user.lastName}` : "Not signed in"}</span>
            <Link href="/admin/sign-in" className="t-label text-blue hover:underline">
              {user?.staffRole ? "Switch" : "Sign in"}
            </Link>
          </div>
        </header>
        <main className="flex-1 bg-white p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}

export function useAdminRole() {
  const user = useCurrentUser()
  const signedIn = useStore((s) => s.session.adminSignedIn)
  return { role: user?.staffRole ?? null, signedIn: signedIn && !!user?.staffRole }
}
