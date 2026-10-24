"use client"
import * as React from "react"
import Link from "next/link"
import { Lock, X } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { ButtonLink, IconButton } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { useOps, type OpsCtx } from "@/components/biz/ops/useOps"
import { cn } from "@/lib/utils"
import type { Business, Listing } from "@/lib/types"

export type DashCtx = OpsCtx & { biz: Business; listing: Listing }

/**
 * A dashboard page: declares its screen ID, a title row with optional actions, and the
 * no-business and owner-only states (staff see Overview, Inbox and their own Diary, as in the app).
 */
export function DashPage({
  id,
  title,
  sub,
  actions,
  ownerOnly,
  className,
  headerSrOnlyFromLg,
  children,
}: {
  id: string
  title: string | ((ctx: DashCtx) => string)
  sub?: React.ReactNode | ((ctx: DashCtx) => React.ReactNode)
  actions?: (ctx: DashCtx) => React.ReactNode
  ownerOnly?: boolean
  className?: string
  /** Full-height pages (W-14) keep the heading for screen readers only from 1024 px. */
  headerSrOnlyFromLg?: boolean
  children: (ctx: DashCtx) => React.ReactNode
}) {
  const ctx = useOps()
  if (!ctx.biz || !ctx.listing || !ctx.role) {
    return (
      <>
        <ScreenMeta id={id} />
        <div className="card mx-auto max-w-xl">
          <EmptyState title="No business yet" body="Claim or add your business to get calls, messages and bookings from Answerd." action={<ButtonLink href="/claim" size="md">Claim or add your business</ButtonLink>} />
        </div>
      </>
    )
  }
  const ready = ctx as DashCtx
  const t = typeof title === "function" ? title(ready) : title
  const sb = typeof sub === "function" ? sub(ready) : sub
  return (
    <div className={cn("mx-auto w-full max-w-[1280px]", className)}>
      <ScreenMeta id={id} />
      <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", headerSrOnlyFromLg && "mb-4 lg:sr-only")}>
        <div className="min-w-0">
          <h1 className="t-title">{t}</h1>
          {sb && <div className="mt-0.5 t-label font-normal text-slate">{sb}</div>}
        </div>
        {actions && !(ownerOnly && ctx.staff) && <div className="flex flex-wrap items-center gap-2">{actions(ready)}</div>}
      </div>
      {ownerOnly && ctx.staff ? <OwnerOnly /> : children(ready)}
    </div>
  )
}

export function OwnerOnly() {
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center p-8 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-sky text-navy">
        <Lock className="size-5" aria-hidden />
      </span>
      <p className="mt-3 t-subhead">Only the owner can see this</p>
      <p className="mt-1 t-body text-slate">Staff see the overview, the shared inbox and their own jobs in the diary.</p>
      <ButtonLink href="/dashboard" size="md" variant="secondary" className="mt-4">
        Back to the overview
      </ButtonLink>
    </div>
  )
}

/** Tabs as links (?tab=), so each tab has a URL and the browser back button works. */
export function LinkTabs<T extends string>({ tabs, value, hrefFor, label, className }: { tabs: readonly { value: T; label: string }[]; value: T; hrefFor: (v: T) => string; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-line px-1", className)}>
      {tabs.map((t) => (
        <Link
          key={t.value}
          href={hrefFor(t.value)}
          scroll={false}
          aria-current={t.value === value ? "page" : undefined}
          className={cn("relative inline-flex h-11 shrink-0 items-center rounded-t-lg px-3.5 t-label transition-colors", t.value === value ? "text-blue after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-blue" : "text-slate hover:bg-white hover:text-navy")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

/**
 * Right-hand side panel for details (a job, a request, Add to diary, the test call).
 * Escape and the backdrop close it, unless a sheet or dialog is open on top.
 */
export function SidePanel({ open, onClose, title, children, footer, width = 460 }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: number }) {
  const titleId = React.useId()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef(onClose)
  React.useEffect(() => {
    closeRef.current = onClose
  })
  React.useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (document.querySelector('[role="dialog"][aria-modal="true"]:not([data-side-panel])')) return
      closeRef.current()
    }
    window.addEventListener("keydown", onKey)
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("[data-panel-close]")?.focus(), 30)
    return () => {
      window.removeEventListener("keydown", onKey)
      clearTimeout(t)
      if (prev && document.contains(prev)) prev.focus()
    }
  }, [open])
  if (!open) return null
  return (
    <>
      <button type="button" aria-label="Close panel" tabIndex={-1} className="fixed inset-0 z-40 bg-navy/25 animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        data-side-panel
        aria-labelledby={titleId}
        className="fixed inset-y-0 right-0 z-40 flex w-full flex-col bg-sky shadow-overlay animate-fade-in"
        style={{ maxWidth: width }}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-white pl-5 pr-2">
          <h2 id={titleId} className="min-w-0 flex-1 truncate t-heading">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose} data-panel-close>
            <X />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-white px-4 py-3">{footer}</div>}
      </div>
    </>
  )
}

/** A white section with a heading and an optional link on the right. */
export function Panel({ title, action, children, className, id }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  const hid = React.useId()
  return (
    <section aria-labelledby={hid} className={className} id={id}>
      <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
        <h2 id={hid} className="t-heading">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
