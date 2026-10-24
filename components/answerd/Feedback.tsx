"use client"
import * as React from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw, WifiOff, X } from "lucide-react"
import { Mark } from "@/components/brand/Mark"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { useToasts } from "@/lib/toast"

export type BannerTone = "info" | "success" | "warning" | "error"

const TONE = {
  info: { cls: "bg-blue-tint text-navy", icon: Info, iconCls: "text-blue" },
  success: { cls: "bg-teal-tint text-navy", icon: CheckCircle2, iconCls: "text-teal-ink" },
  warning: { cls: "bg-amber-tint text-navy", icon: AlertTriangle, iconCls: "text-amber-ink" },
  error: { cls: "bg-red-tint text-navy", icon: AlertCircle, iconCls: "text-red" },
}

export function Banner({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
  icon,
}: {
  tone?: BannerTone
  title?: React.ReactNode
  children?: React.ReactNode
  action?: React.ReactNode
  onDismiss?: () => void
  className?: string
  icon?: React.ReactNode
}) {
  const t = TONE[tone]
  const I = t.icon
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl p-3.5", t.cls, className)}>
      <span className={cn("mt-0.5 shrink-0", t.iconCls)}>{icon ?? <I className="size-5" aria-hidden />}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="t-label font-semibold text-navy">{title}</p>}
        {children && <div className="t-label font-normal text-slate">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-m-1 inline-flex size-8 items-center justify-center rounded-full text-slate hover:bg-black/5">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, body, action, className }: { title: string; body: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <span className="mb-4 inline-flex size-20 items-center justify-center rounded-full bg-blue-tint">
        <Mark size={44} />
      </span>
      <h3 className="t-heading">{title}</h3>
      <p className="mt-1 max-w-xs t-body text-slate">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = "Something went wrong", body = "We couldn't load this. Check your connection and try again.", onRetry }: { title?: string; body?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-red-tint text-red">
        <AlertCircle className="size-7" aria-hidden />
      </span>
      <h3 className="t-heading">{title}</h3>
      <p className="mt-1 max-w-xs t-body text-slate">{body}</p>
      <Button variant="secondary" size="md" className="mt-5" onClick={onRetry ?? (() => window.location.reload())}>
        <RefreshCw /> Try again
      </Button>
    </div>
  )
}

export function OfflineBanner({ className }: { className?: string }) {
  return (
    <div role="status" className={cn("flex items-center gap-2 bg-navy px-4 py-2 text-white t-caption", className)}>
      <WifiOff className="size-4" aria-hidden />
      You&apos;re offline. We&apos;ll send it when you&apos;re back.
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-[#E7ECF3]", className)} aria-hidden />
}

export function ResultCardSkeleton() {
  return (
    <div className="card flex gap-3 p-3.5">
      <Skeleton className="size-14 rounded-xl" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <ResultCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Navy pill toasts above the tab bar. */
export function Toaster({ className }: { className?: string }) {
  const items = useToasts((s) => s.items)
  const dismiss = useToasts((s) => s.dismiss)
  if (!items.length) return null
  return (
    <div className={cn("pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4", className)} aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-full bg-navy py-2.5 pl-4 pr-2 text-white shadow-overlay animate-fade-in">
          <span className="t-label">{t.text}</span>
          {t.undo ? (
            <button
              type="button"
              className="rounded-full px-3 py-1 t-label font-semibold text-[#9DB8FF] hover:bg-white/10"
              onClick={() => {
                t.undo?.()
                dismiss(t.id)
              }}
            >
              Undo
            </button>
          ) : (
            <button type="button" aria-label="Dismiss" className="inline-flex size-7 items-center justify-center rounded-full hover:bg-white/10" onClick={() => dismiss(t.id)}>
              <X className="size-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
