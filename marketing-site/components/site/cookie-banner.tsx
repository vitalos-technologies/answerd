"use client"
import * as React from "react"
import Link from "next/link"
import { setConsent, useConsent } from "./consent"
import type { site } from "@/content/site"

type CookieCopy = (typeof site)["cookies"]

// Both choices share one style so neither is nudged.
const choice =
  "inline-flex h-12 w-full items-center justify-center rounded-full border border-navy/25 bg-white px-5 text-[15px] font-semibold whitespace-nowrap text-navy transition-colors duration-150 sm:flex-1 hover:border-navy/40 hover:bg-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"

/**
 * Cookie choice banner. Server-rendered so it is part of the first paint (it is often the LCP element on
 * phones); for returning visitors an inline script in <head> flags <html data-consent> and CSS hides it
 * before paint. It publishes its height as `--cookie-banner-h` on <html> so the chat pill can sit above it.
 * When it comes back (Cookie settings), it rises in via @starting-style in globals.css.
 */
export function CookieBannerClient({ copy }: { copy: CookieCopy }) {
  const consent = useConsent()
  const show = consent === null || consent === undefined
  const [leaving, setLeaving] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const root = document.documentElement
    if (!show || !ref.current) {
      root.style.setProperty("--cookie-banner-h", "0px")
      return
    }
    const el = ref.current
    const ro = new ResizeObserver(() => root.style.setProperty("--cookie-banner-h", `${el.offsetHeight + 12}px`))
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.setProperty("--cookie-banner-h", "0px")
    }
  }, [show])

  // Slide out, then record the choice (which unmounts the banner). Instant under reduced motion.
  const choose = (value: "all" | "essential") => {
    if (leaving) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return setConsent(value)
    setLeaving(true)
    window.setTimeout(() => {
      setConsent(value)
      setLeaving(false)
    }, 250)
  }

  if (!show) return null
  return (
    <div
      ref={ref}
      role="region"
      aria-label={copy.label}
      data-cookie-banner=""
      data-leaving={leaving || undefined}
      className="card-site fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 p-5 shadow-overlay transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] data-leaving:translate-y-6 data-leaving:opacity-0 motion-reduce:transition-none md:inset-x-auto md:bottom-6 md:left-6 md:max-w-[480px] md:p-6"
    >
      <p className="t-small text-slate md:text-[15px] md:leading-6">
        {copy.text}{" "}
        <Link href="/cookies" className="font-semibold text-blue underline underline-offset-2 hover:text-blue-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue">
          {copy.policy}
        </Link>
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" className={choice} onClick={() => choose("all")}>
          {copy.accept}
        </button>
        <button type="button" className={choice} onClick={() => choose("essential")}>
          {copy.reject}
        </button>
      </div>
    </div>
  )
}

const CURRENT: Record<"all" | "essential" | "none", string> = {
  all: "You have accepted all cookies, including the Askbridge chat and analytics.",
  essential: "You have chosen essential cookies only.",
  none: "You haven't made a choice yet.",
}

/** For the cookies page: clears the stored choice so the banner asks again. */
export function CookieSettingsClient({ copy }: { copy: CookieCopy }) {
  const consent = useConsent()
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-slate" aria-live="polite">
        {consent === undefined ? " " : CURRENT[consent ?? "none"]}
      </p>
      <button
        type="button"
        onClick={() => setConsent(null)}
        className="inline-flex h-12 items-center justify-center rounded-full bg-blue px-6 font-semibold text-white transition-colors duration-150 hover:bg-blue-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
      >
        {copy.settings}
      </button>
    </div>
  )
}
