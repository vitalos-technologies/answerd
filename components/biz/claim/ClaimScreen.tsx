"use client"
import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { useClaimAuth } from "@/components/app/claim"

/** App wrapper for the claim and verification steps: full screen, white, no tabs; guests sign in first. Needs a Suspense boundary (withSuspense). */
export function ClaimScreen({ id, title, back, children, className }: { id: string; title: string; back: string | true; children: React.ReactNode; className?: string }) {
  const pathname = usePathname()
  const sp = useSearchParams()
  const qs = sp.toString()
  const userId = useClaimAuth(qs ? `${pathname}?${qs}` : pathname)
  return (
    <AppScreen id={id} bg="white" header={<TopBar title={title} back={back} />}>
      <div className={className ?? "flex min-h-full flex-col px-4 pb-8 pt-3"}>{userId ? children : null}</div>
    </AppScreen>
  )
}
