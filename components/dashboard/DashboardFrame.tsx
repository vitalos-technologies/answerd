"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Lock } from "lucide-react"
import { DashboardShell } from "@/components/shells/DashboardShell"
import { OpsLinksProvider } from "@/components/biz/ops/links"
import { SheetLayoutProvider } from "@/components/answerd/Sheet"
import { Skeleton, Toaster } from "@/components/answerd/Feedback"
import { Logo } from "@/components/brand/Logo"
import { useStore } from "@/lib/store"
import { membershipsFor } from "@/lib/selectors"
import { dashOpsLinks } from "./links"

/** Who may use the dashboard right now, and where to send everyone else. */
function useDashboardAccess() {
  const s = useStore()
  const { hydrated } = s
  const userId = s.session.userId
  const mems = membershipsFor(s, userId)
  return { hydrated, userId, mems, allowed: hydrated && !!userId && mems.length > 0 }
}

/**
 * Wraps every /dashboard route: guests and customer-only accounts go to W-12 with next set,
 * the session switches to business mode (the dashboard is the desktop face of business mode),
 * and the reusable business components get dashboard routes and desktop dialogs.
 * Checkout and the billing portal render as "hosted" pages without the sidebar.
 */
function FrameInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const sp = useSearchParams()
  const router = useRouter()
  const { hydrated, userId, mems, allowed } = useDashboardAccess()
  const mode = useStore((s) => s.session.mode)
  const currentBusinessId = useStore((s) => s.session.currentBusinessId)
  const setMode = useStore((s) => s.setMode)
  const qs = sp.toString()
  const next = `${pathname}${qs ? `?${qs}` : ""}`
  const memberOfCurrent = mems.some((m) => m.businessId === currentBusinessId)
  const firstBiz = mems[0]?.businessId

  React.useEffect(() => {
    if (!hydrated || allowed) return
    router.replace(`/sign-in?next=${encodeURIComponent(next)}${userId ? "&reason=business" : ""}`)
  }, [hydrated, allowed, userId, next, router])

  React.useEffect(() => {
    if (!allowed) return
    if (!memberOfCurrent && firstBiz) setMode("business", firstBiz)
    else if (mode !== "business") setMode("business", currentBusinessId)
  }, [allowed, memberOfCurrent, firstBiz, mode, currentBusinessId, setMode])

  const hosted = pathname.startsWith("/dashboard/billing/checkout") || pathname.startsWith("/dashboard/billing/portal")
  if (!allowed || !memberOfCurrent) return <FrameLoading hosted={hosted} redirecting={hydrated && !allowed} />

  return (
    <OpsLinksProvider value={dashOpsLinks}>
      <SheetLayoutProvider value="dialog">{hosted ? <HostedShell>{children}</HostedShell> : <DashboardShell>{children}</DashboardShell>}</SheetLayoutProvider>
    </OpsLinksProvider>
  )
}

export function DashboardFrame({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<FrameLoading />}>
      <FrameInner>{children}</FrameInner>
    </React.Suspense>
  )
}

function FrameLoading({ hosted, redirecting }: { hosted?: boolean; redirecting?: boolean }) {
  return (
    <div className="flex min-h-dvh bg-sky" aria-busy="true">
      {!hosted && <div className="hidden w-[240px] shrink-0 border-r border-line bg-white lg:block" />}
      <div className="flex-1">
        <div className="h-16 border-b border-line bg-white" />
        <div className="space-y-4 p-6">
          {redirecting ? (
            <p className="flex items-center gap-2 t-label font-normal text-slate">
              <Lock className="size-4" aria-hidden /> Taking you to sign in…
            </p>
          ) : (
            <>
              <Skeleton className="h-8 w-60" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Chrome for the mock hosted pages (checkout and billing portal): no sidebar, a way back, a clear prototype label. */
function HostedShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-sky">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1040px] items-center justify-between gap-3 px-6 max-sm:pl-14 max-sm:pr-4">
          <Link href="/dashboard/billing" className="inline-flex h-11 items-center gap-1.5 rounded-full px-2 t-label text-navy hover:bg-sky">
            <ArrowLeft className="size-5" aria-hidden />
            Back to billing
          </Link>
          <Logo size={26} />
        </div>
      </header>
      <main className="mx-auto max-w-[1040px] px-6 py-8 max-sm:px-4 max-sm:py-5">{children}</main>
      <Toaster />
    </div>
  )
}
