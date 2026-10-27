"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useStore } from "@/lib/store"
import { bootApiMode } from "@/lib/api/boot"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Mark } from "@/components/brand/Mark"
import { Toaster } from "@/components/answerd/Feedback"
import { ScreenIdBadge } from "./ScreenMeta"
import { cn } from "@/lib/utils"

/** Rehydrates the persisted demo store after mount so server and first client render match, then starts API mode if it is on. */
export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).finally(() => {
      if (!useStore.getState().hydrated) useStore.setState({ hydrated: true })
      bootApiMode()
    })
  }, [])
  return <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
}

/** Dashboard and admin shells put prototype chrome in the top-right corner, clear of their sidebars. */
const cornerShell = (pathname: string) => pathname.startsWith("/dashboard") || pathname.startsWith("/admin")

function HubButtonInner() {
  const params = useSearchParams()
  const pathname = usePathname()
  if (params.get("clean") === "1" || pathname.startsWith("/hub")) return null
  const corner = cornerShell(pathname)
  return (
    // A 40 px circle: top-right on the dashboard and admin shells (their headers pad for it in globals.css),
    // bottom-left elsewhere; in the full-screen app below 500 px it sits above the tab bar
    <Link
      href="/hub"
      data-hub-corner={corner || undefined}
      title="Prototype hub"
      className={cn(
        "no-print fixed z-[80] inline-flex size-10 items-center justify-center rounded-full bg-navy shadow-overlay hover:bg-[#163a72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
        corner ? (pathname.startsWith("/admin") ? "right-4 top-2" : "right-4 top-3") : "bottom-4 left-4",
        pathname.startsWith("/app") && "max-[499px]:bottom-24 max-[499px]:left-2",
      )}
      aria-label="Open the prototype hub"
    >
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-white">
        <Mark size={20} />
      </span>
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

/**
 * Toasts and the screen ID badge for surfaces outside the phone frame. The badge sits in the top-right
 * corner, clear of logos: under the Hub circle on the dashboard and admin shells, in the corner elsewhere.
 */
export function GlobalChrome() {
  const pathname = usePathname()
  if (pathname.startsWith("/app")) return null
  if (cornerShell(pathname)) return <ScreenIdBadge className={cn("fixed right-4 h-5", pathname.startsWith("/admin") ? "top-[51px]" : "top-[55px]")} />
  return (
    <>
      <ScreenIdBadge className="fixed right-1 top-1 h-5" />
      <Toaster />
    </>
  )
}
