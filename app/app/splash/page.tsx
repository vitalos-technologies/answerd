"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/brand/Logo"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { useStore } from "@/lib/store"

/** C-01: stacked logo for 1.2 s, then C-02 on a first visit or C-09 when returning. */
export default function SplashPage() {
  const router = useRouter()
  const onboarded = useStore((s) => s.session.onboarded)
  // The app reopens in the last mode used (business mode is remembered after a claim)
  const business = useStore((s) => s.session.mode === "business" && !!s.session.currentBusinessId)
  React.useEffect(() => {
    const t = setTimeout(() => router.replace(business ? "/app/biz" : onboarded ? "/app" : "/app/welcome"), 1200)
    return () => clearTimeout(t)
  }, [onboarded, business, router])
  return (
    <div className="t-app absolute inset-0 flex flex-col items-center justify-center bg-white">
      <ScreenMeta id="C-01" />
      <div className="animate-fade-in">
        <Logo variant="stacked" tagline size={34} />
      </div>
      <span className="sr-only" role="status">
        Loading Answerd
      </span>
    </div>
  )
}
