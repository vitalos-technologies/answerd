"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, CalendarDays, House, Inbox, LayoutGrid, MessageCircle, Search, Sun, User, X } from "lucide-react"
import { DeskIcon } from "@/components/brand/DeskIcon"
import { useStore, useCurrentBusiness } from "@/lib/store"
import { OfflineBanner } from "@/components/answerd/Feedback"
import { ScreenMeta } from "./ScreenMeta"
import { cn } from "@/lib/utils"
import { isStaffOnly, roleIn } from "@/lib/selectors"

export function TopBar({
  title,
  back,
  close,
  actions,
  tone = "light",
  className,
  subtitle,
}: {
  title?: React.ReactNode
  back?: string | true
  close?: string | true
  actions?: React.ReactNode
  tone?: "light" | "navy" | "clear"
  className?: string
  subtitle?: React.ReactNode
}) {
  const router = useRouter()
  const nav = (to: string | true) => (to === true ? router.back() : router.push(to))
  const btn = cn("inline-flex size-11 items-center justify-center rounded-full", tone === "navy" ? "text-white hover:bg-white/10" : "text-navy hover:bg-blue-tint")
  return (
    <header className={cn("flex min-h-14 shrink-0 items-center gap-1 px-2", tone === "light" && "border-b border-line bg-white", tone === "navy" && "bg-navy text-white", className)}>
      {back ? (
        <button type="button" onClick={() => nav(back)} className={btn} aria-label="Back">
          <ArrowLeft className="size-5" />
        </button>
      ) : close ? (
        <button type="button" onClick={() => nav(close)} className={btn} aria-label="Close">
          <X className="size-5" />
        </button>
      ) : (
        <span className="w-2" />
      )}
      <div className="min-w-0 flex-1">
        {title && <h1 className={cn("truncate t-subhead", tone === "navy" && "text-white")}>{title}</h1>}
        {subtitle && <p className={cn("truncate t-caption", tone === "navy" ? "text-white/80" : "text-muted-ink")}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center">{actions}</div>}
    </header>
  )
}

/** Navy strip with the business name and a "Business" pill. */
export function BizHeader({ right, title }: { right?: React.ReactNode; title?: string }) {
  const biz = useCurrentBusiness()
  const listings = useStore((s) => s.listings)
  const supportView = useStore((s) => s.session.supportViewBusinessId)
  const name = title ?? listings.find((l) => l.id === biz?.listingId)?.name ?? "Your business"
  return (
    <div className="shrink-0 bg-navy text-white">
      {supportView && (
        <p className="flex items-center justify-center gap-2 bg-amber px-4 py-1 text-center t-caption text-navy">
          Viewing as support (audited) · read only
          {/* P9: back to the admin console, which ends the support view */}
          <Link href="/admin/businesses" className="inline-flex min-h-6 items-center font-semibold underline underline-offset-2">
            Exit
          </Link>
        </p>
      )}
      <div className="flex min-h-12 items-center gap-2 px-4 pb-2.5 pt-1">
        <p className="min-w-0 flex-1 truncate t-subhead text-white">{name}</p>
        <span className="rounded-full bg-white/15 px-2.5 py-0.5 t-caption text-white">Business</span>
        {right}
      </div>
    </div>
  )
}

function TabLink({ href, label, icon: I, active, badge }: { href: string; label: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; active: boolean; badge?: number }) {
  return (
    <Link href={href} className={cn("relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 pt-1.5", active ? "text-blue" : "text-muted-ink hover:text-navy")} aria-current={active ? "page" : undefined}>
      <span className="relative">
        <I className="size-6" aria-hidden />
        {!!badge && (
          <span className="absolute -right-2.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red px-1 text-[11px] font-semibold text-white tnum" aria-label={`${badge} new`}>
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="text-[11px] font-medium leading-4">{label}</span>
    </Link>
  )
}

export function CustomerTabs() {
  const pathname = usePathname()
  const userId = useStore((s) => s.session.userId)
  const bookings = useStore((s) => s.bookings)
  const threads = useStore((s) => s.threads)
  const upcoming = userId ? bookings.filter((b) => b.customerId === userId && ["requested", "confirmed", "on_the_way", "arrived"].includes(b.status)).length : 0
  const unread = userId ? threads.filter((t) => t.customerId === userId && t.unreadCustomer > 0).length : 0
  const is = (p: string, exact = false) => (exact ? pathname === p : pathname === p || pathname.startsWith(p + "/"))
  return (
    <nav aria-label="Main" className="flex shrink-0 border-t border-line bg-white pb-5 max-[499px]:pb-2">
      <TabLink href="/app" label="Home" icon={House} active={is("/app", true)} />
      <TabLink href="/app/search" label="Search" icon={Search} active={is("/app/search") || is("/app/results")} />
      <TabLink href="/app/bookings" label="Bookings" icon={CalendarDays} active={is("/app/bookings")} badge={upcoming} />
      <TabLink href="/app/messages" label="Messages" icon={MessageCircle} active={is("/app/messages")} badge={unread} />
      <TabLink href="/app/account" label="Account" icon={User} active={is("/app/account")} />
    </nav>
  )
}

export function BusinessTabs() {
  const pathname = usePathname()
  const s = useStore()
  const biz = useCurrentBusiness()
  const staff = isStaffOnly(s, s.session.userId) || roleIn(s, s.session.userId, biz?.id ?? null) === "staff"
  const needs = s.threads.filter((t) => t.listingId === biz?.listingId && (t.status === "needs_owner" || t.unreadBusiness > 0) && !t.spam).length
  const requests = s.bookings.filter((b) => b.listingId === biz?.listingId && (b.status === "requested" || b.changeRequest)).length
  const is = (p: string, exact = false) => (exact ? pathname === p : pathname === p || pathname.startsWith(p + "/"))
  return (
    <nav aria-label="Business" className="flex shrink-0 border-t border-line bg-white pb-5 max-[499px]:pb-2">
      <TabLink href="/app/biz" label="Today" icon={Sun} active={is("/app/biz", true)} badge={staff ? 0 : requests} />
      <TabLink href="/app/biz/inbox" label="Inbox" icon={Inbox} active={is("/app/biz/inbox") || is("/app/biz/calls") || is("/app/biz/requests")} badge={needs} />
      <TabLink href="/app/biz/diary" label="Diary" icon={CalendarDays} active={is("/app/biz/diary") || is("/app/biz/jobs")} />
      {!staff && <TabLink href="/app/biz/desk" label="Desk" icon={DeskIcon} active={is("/app/biz/desk")} />}
      {!staff && <TabLink href="/app/biz/more" label="More" icon={LayoutGrid} active={is("/app/biz/more")} />}
    </nav>
  )
}

/**
 * Standard app screen: optional header, scrolling body, optional footer (above tabs) and tab bar.
 * Fills the phone frame.
 */
export function AppScreen({
  id,
  header,
  tabs,
  footer,
  children,
  className,
  bodyClassName,
  biz,
  bg = "sky",
}: {
  id: string
  header?: React.ReactNode
  tabs?: "customer" | "business"
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  biz?: boolean | React.ReactNode
  bg?: "sky" | "white"
}) {
  const offline = useStore((s) => s.offline)
  return (
    <div className={cn("t-app absolute inset-0 flex flex-col", bg === "white" ? "bg-white" : "bg-sky", className)}>
      <ScreenMeta id={id} />
      {biz && (biz === true ? <BizHeader /> : biz)}
      {offline && <OfflineBanner />}
      {header}
      {/* With no tab bar, the last thing on screen keeps clear of the home indicator (pb-home) */}
      <main className={cn("relative min-h-0 flex-1 overflow-y-auto overscroll-contain", !tabs && !footer && "pb-home", bodyClassName)}>{children}</main>
      {footer && (tabs ? footer : <div className="shrink-0 bg-white pb-home">{footer}</div>)}
      {tabs === "customer" && <CustomerTabs />}
      {tabs === "business" && <BusinessTabs />}
    </div>
  )
}
