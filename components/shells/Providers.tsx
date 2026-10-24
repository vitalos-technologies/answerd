"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useStore } from "@/lib/store"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Mark } from "@/components/brand/Mark"
import { Toaster } from "@/components/answerd/Feedback"
import { ScreenIdBadge } from "./ScreenMeta"

/** Rehydrates the persisted demo store after mount so server and first client render match. */
export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void useStore.persist.rehydrate()
  }, [])
  return <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
}

function HubButtonInner() {
  const params = useSearchParams()
  const pathname = usePathname()
  if (params.get("clean") === "1" || pathname.startsWith("/hub")) return null
  return (
    <Link
      href="/hub"
      className="no-print fixed bottom-4 left-4 z-[80] inline-flex h-11 items-center gap-2 rounded-full bg-navy pl-2 pr-4 t-label font-semibold text-white shadow-overlay hover:bg-[#163a72]"
      aria-label="Open the prototype hub"
    >
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-white">
        <Mark size={20} />
      </span>
      Hub
    </Link>
  )
}

export function HubButton() {
  return (
    <React.Suspense fallback={null}>
      <HubButtonInner />
    </React.Suspense>
  )
}

/** Toasts and screen ID badge for surfaces outside the phone frame. */
export function GlobalChrome() {
  const pathname = usePathname()
  if (pathname.startsWith("/app") || pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return pathname.startsWith("/app") ? null : <ScreenIdBadge className="fixed left-2 top-2" />
  }
  return (
    <>
      <ScreenIdBadge className="fixed left-2 top-2" />
      <Toaster />
    </>
  )
}
