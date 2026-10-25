"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  ChevronDown,
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
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/answerd/Feedback"
import { SUPER_NAV } from "@/components/admin/super/nav"
import type { StaffRole } from "@/lib/types"

type NavItem = { href: string; label: string; icon: typeof Store; id: string }

export const ADMIN_NAV: NavItem[] = [
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

const byId = (ids: string[]) => ids.map((id) => ADMIN_NAV.find((n) => n.id === id)!)

/** Design review (25 Oct): the sidebar in collapsible groups; Super admin on top for the super admin only. */
export const ADMIN_GROUPS: { key: string; label: string; items: NavItem[]; superOnly?: boolean }[] = [
  { key: "super", label: "Super admin", items: SUPER_NAV, superOnly: true },
  { key: "trust", label: "Trust", items: byId(["A-06", "A-07", "A-08", "A-09"]) },
  { key: "people", label: "People", items: byId(["A-10", "A-11", "A-12"]) },
  { key: "data", label: "Marketplace data", items: byId(["A-03", "A-13", "A-14", "A-15", "A-16"]) },
  { key: "money", label: "Money", items: byId(["A-17", "A-18", "A-19"]) },
  { key: "system", label: "System", items: byId(["A-20", "A-21", "A-22", "A-23"]) },
]

export const ROLE_LABEL: Record<StaffRole, string> = { super_admin: "Super admin", admin: "Admin", support: "Support" }

const OPEN_KEY = "answerd-admin-nav-open"

const openListeners = new Set<() => void>()
let openMemory = "{}"

function openSnapshot() {
  try {
    return localStorage.getItem(OPEN_KEY) ?? openMemory
  } catch {
    return openMemory
  }
}

function writeOpen(v: Record<string, boolean>) {
  openMemory = JSON.stringify(v)
  try {
    localStorage.setItem(OPEN_KEY, openMemory)
  } catch {
    /* storage blocked: keep it in memory */
  }
  openListeners.forEach((l) => l())
}

/** Which groups the viewer opened (per-viewer convenience; the nav works without storage). */
function useOpenGroups(): Record<string, boolean> {
  const raw = React.useSyncExternalStore(
    (l) => {
      openListeners.add(l)
      return () => openListeners.delete(l)
    },
    openSnapshot,
    () => "{}",
  )
  return React.useMemo(() => {
    try {
      return JSON.parse(raw) as Record<string, boolean>
    } catch {
      return {}
    }
  }, [raw])
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn("flex h-9 items-center gap-2.5 rounded-lg pl-3 pr-2 text-[13px] font-medium", active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white")}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

/** Grouped admin navigation: the group holding the current page is always open; the others remember their state. */
function AdminNav({ role }: { role: StaffRole | null }) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === "/admin" ? pathname === href : href === "/admin/super" ? pathname === href : pathname === href || pathname.startsWith(href + "/"))
  const open = useOpenGroups()
  const toggle = (key: string, next: boolean) => writeOpen({ ...open, [key]: next })
  const groups = ADMIN_GROUPS.filter((g) => !g.superOnly || role === "super_admin")
  return (
    <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3" aria-label="Admin">
      <NavLink item={ADMIN_NAV[0]!} active={isActive("/admin")} />
      {groups.map((g) => {
        const current = g.items.some((n) => isActive(n.href))
        const expanded = current || (open[g.key] ?? false)
        const listId = `admin-nav-${g.key}`
        return (
          <div key={g.key} className={cn("mt-1", g.superOnly && "mb-2 rounded-xl bg-white/[0.06] pb-1")}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => toggle(g.key, !expanded)}
              disabled={current}
              className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-[11.5px] font-semibold uppercase tracking-wide text-white/75 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:hover:bg-transparent"
            >
              <span className="min-w-0 flex-1 truncate">{g.label}</span>
              {g.superOnly && <span className="rounded-full bg-amber px-1.5 text-[10px] font-semibold normal-case tracking-normal text-navy">Owner</span>}
              <ChevronDown className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")} aria-hidden />
            </button>
            <div id={listId} hidden={!expanded}>
              {g.items.map((n) => (
                <NavLink key={n.href} item={n} active={isActive(n.href)} />
              ))}
            </div>
          </div>
        )
      })}
    </nav>
  )
}

/** Navy sidebar, white canvas, dense tables, a role pill. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { role, user } = useAdminRole()
  if (pathname === "/admin/sign-in") return <>{children}</>
  return (
    <div className="flex min-h-dvh bg-white">
      <aside className="sticky top-0 flex h-dvh w-[232px] shrink-0 flex-col bg-navy text-white">
        <Link href="/admin" className="flex h-16 shrink-0 items-center gap-2 px-5" aria-label="Answerd admin overview">
          <Logo variant="reversed" layout="horizontal" size={26} />
        </Link>
        <AdminNav role={role} />
        <div className="shrink-0 border-t border-white/15 p-4 text-[12px] text-white/75">
          <ClipboardList className="mr-1 inline size-3.5" aria-hidden /> Every write is audited
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-6">
          <p className="t-label text-navy">Answerd admin</p>
          <div className="ml-auto flex items-center gap-3">
            {role && <span className={cn("rounded-full px-2.5 py-0.5 t-caption", role === "super_admin" ? "bg-amber-tint text-amber-ink ring-1 ring-amber" : role === "admin" ? "bg-navy text-white" : "bg-amber-tint text-amber-ink")}>{ROLE_LABEL[role]}</span>}
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

/** The signed-in staff member. During an S-09 "view as customer" the session user is the customer, so the staff member comes from the impersonation. */
export function useAdminRole() {
  const sessionUserId = useStore((s) => s.session.userId)
  const byUserId = useStore((s) => s.session.impersonation?.byUserId)
  const users = useStore((s) => s.users)
  const signedIn = useStore((s) => s.session.adminSignedIn)
  const user = users.find((u) => u.id === (byUserId ?? sessionUserId))
  const role: StaffRole | null = user?.staffRole ?? null
  return { role, signedIn: signedIn && !!role, user }
}
