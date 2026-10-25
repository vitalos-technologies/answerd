"use client"
// The super admin's rules (S-06) and switches (S-07) as other surfaces show them: the app's maintenance screen
// (C-48), paused sign-ups and claims, and the S-09 customer-view bar.
import * as React from "react"
import { usePathname } from "next/navigation"
import { Construction, PauseCircle, RefreshCw } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Mark } from "@/components/brand/Mark"
import { useStore } from "@/lib/store"
import { platformFor, rulesFor } from "@/lib/selectors"
import { plural } from "@/lib/format"
import { cn } from "@/lib/utils"

type Sel = Parameters<typeof rulesFor>[0]

/** Rules in force on the demo clock (memoised: selectors must not return fresh objects). */
export function useRules() {
  const settings = useStore((s) => s.settings)
  const clock = useStore((s) => s.clock)
  return React.useMemo(() => rulesFor({ settings, clock } as Sel), [settings, clock])
}

export function usePlatform() {
  const settings = useStore((s) => s.settings)
  return React.useMemo(() => platformFor({ settings } as Sel), [settings])
}

// ------------------------------------------------------------------ maintenance (S-07)

/** C-48 maintenance screen: every app screen shows it while maintenance mode is on. */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const p = usePlatform()
  const pathname = usePathname()
  if (!p.maintenance || pathname === "/app/states") return <>{children}</>
  return (
    <AppScreen id="C-48" bg="white" header={<TopBar title="Answerd" />}>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
        <span className="relative inline-flex size-20 items-center justify-center rounded-full bg-blue-tint">
          <Mark size={44} />
          <span className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full bg-amber text-navy">
            <Construction className="size-4" aria-hidden />
          </span>
        </span>
        <h1 className="mt-4 t-heading">We&apos;re making Answerd better</h1>
        <p className="mt-1 t-body text-slate">{p.maintenanceMessage}</p>
        <Button className="mt-5" variant="secondary" size="md" onClick={() => window.location.reload()}>
          <RefreshCw /> Try again
        </Button>
      </div>
    </AppScreen>
  )
}

// ------------------------------------------------------------------ paused sign-ups and claims (S-07)

export function useSwitch(key: "signups" | "claims" | "payments" | "ask") {
  return usePlatform()[key]
}

/** A full-screen paused state for a blocked flow (C-08, B-01, W-11). */
export function PausedNotice({ title, body, action, className }: { title: string; body: string; action: { href: string; label: string }; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)} role="status">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-amber-tint">
        <PauseCircle className="size-8 text-amber-ink" aria-hidden />
      </span>
      <h1 className="mt-4 t-heading">{title}</h1>
      <p className="mt-1 max-w-md t-body text-slate">{body}</p>
      <ButtonLink href={action.href} size="md" className="mt-5">
        {action.label}
      </ButtonLink>
    </div>
  )
}

/** C-06: existing customers can still sign in while new sign-ups are paused. */
export function SignupsPausedBanner({ className }: { className?: string }) {
  const on = useSwitch("signups")
  if (on) return null
  return (
    <Banner tone="warning" className={className} title="New sign-ups are paused">
      If you already have an Answerd account, sign in as usual. New accounts open again soon.
    </Banner>
  )
}

/** "2 hours" from S-06, for copy that quotes the booking-request window. */
export function RequestWindow() {
  const r = useRules()
  return <>{plural(r.requestExpiryHours, "hour")}</>
}

