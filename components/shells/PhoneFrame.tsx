"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BatteryFull, Signal, Wifi, CheckCircle2, Circle } from "lucide-react"
import { useStore } from "@/lib/store"
import { PERSONAS } from "@/lib/seed"
import { SCREENS, BUILT } from "@/lib/screens"
import { Toaster } from "@/components/answerd/Feedback"
import { ScreenIdBadge, useCurrentScreen } from "./ScreenMeta"
import { cn } from "@/lib/utils"
import { fmtDate, fmtTime } from "@/lib/time"

function StatusBar({ dark }: { dark?: boolean }) {
  return (
    <div className={cn("relative z-30 flex h-11 shrink-0 items-center justify-between px-7 pt-1 text-[15px] font-semibold max-[499px]:hidden", dark ? "bg-navy text-white" : "text-navy")} aria-hidden>
      <span className="tnum">9:41</span>
      <span className="absolute left-1/2 top-2 h-[26px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <Signal className="size-4" />
        <Wifi className="size-4" />
        <BatteryFull className="size-5" />
      </span>
    </div>
  )
}

function SidePanel() {
  const screen = useCurrentScreen()
  const pathname = usePathname()
  const personaId = useStore((s) => s.session.personaId)
  const mode = useStore((s) => s.session.mode)
  const clock = useStore((s) => s.clock)
  const users = useStore((s) => s.users)
  const userId = useStore((s) => s.session.userId)
  const surface = pathname.startsWith("/app/biz") ? "business" : "customer"
  const persona = PERSONAS.find((p) => p.id === personaId)
  const user = users.find((u) => u.id === userId)
  const list = SCREENS.filter((s) => s.surface === surface)
  return (
    <aside className="no-print sticky top-8 hidden max-h-[calc(100dvh-64px)] w-[300px] shrink-0 flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card min-[1100px]:flex">
      <div className="border-b border-line p-5">
        <p className="t-caption text-muted-ink">Screen</p>
        <p className="mt-0.5 font-mono text-sm font-semibold text-blue">{screen?.id ?? "—"}</p>
        <p className="t-subhead">{screen?.title ?? "Unregistered route"}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 t-caption">
          <dt className="text-muted-ink">Persona</dt>
          <dd className="text-navy">{persona?.name ?? (user ? `${user.firstName} ${user.lastName}` : "Guest")}</dd>
          <dt className="text-muted-ink">Mode</dt>
          <dd className="text-navy capitalize">{mode}</dd>
          <dt className="text-muted-ink">Demo clock</dt>
          <dd className="text-navy tnum">
            {fmtDate(clock)}, {fmtTime(clock)}
          </dd>
        </dl>
        <Link href="/hub" className="mt-3 inline-flex t-label text-blue hover:underline">
          Open the prototype hub
        </Link>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label={surface === "business" ? "Business mode screens" : "Customer app screens"}>
        <p className="px-3 pb-1 pt-2 t-caption text-muted-ink">{surface === "business" ? "Business mode" : "Customer app"}</p>
        {list.map((s) => (
          <Link
            key={s.id}
            href={s.example}
            className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 t-caption hover:bg-sky", screen?.id === s.id ? "bg-blue-tint text-blue" : "text-slate")}
          >
            {BUILT.has(s.id) ? <CheckCircle2 className="size-3.5 shrink-0 text-teal-ink" aria-label="Built" /> : <Circle className="size-3.5 shrink-0 text-line" aria-label="Not built yet" />}
            <span className="w-10 shrink-0 font-mono">{s.id}</span>
            <span className="truncate">{s.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

/** 390 × 844 device frame on a sky backdrop; below 500 px wide the app fills the viewport. */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const biz = pathname.startsWith("/app/biz") && !pathname.startsWith("/app/biz/claim")
  const [scale, setScale] = React.useState(1)
  React.useEffect(() => {
    const fit = () => setScale(window.innerWidth < 500 ? 1 : Math.min(1, (window.innerHeight - 48) / 844))
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [])

  return (
    <div className="flex min-h-dvh items-start justify-center gap-8 bg-sky px-4 py-6 max-[499px]:p-0">
      <div className="shrink-0 max-[499px]:w-full" style={{ width: 390 * scale, height: 844 * scale }}>
        <div
          className="relative flex h-[844px] w-[390px] origin-top-left flex-col overflow-hidden rounded-[48px] border-[10px] border-navy bg-sky shadow-overlay max-[499px]:h-dvh max-[499px]:w-full max-[499px]:rounded-none max-[499px]:border-0 max-[499px]:shadow-none"
          style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}
          data-phone-frame
        >
          <StatusBar dark={biz} />
          <div className="relative min-h-0 flex-1">{children}</div>
          <div id="phone-overlay" className="pointer-events-none absolute inset-0 z-50 [&>*]:pointer-events-auto" />
          <ScreenIdBadge className="absolute left-[78px] top-[13px] h-5 max-[499px]:left-1/2 max-[499px]:top-1 max-[499px]:-translate-x-1/2" />
          <Toaster className="absolute bottom-24" />
          <span className="pointer-events-none absolute bottom-1.5 left-1/2 z-[60] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-navy/80 max-[499px]:hidden" aria-hidden />
        </div>
      </div>
      <SidePanel />
    </div>
  )
}
