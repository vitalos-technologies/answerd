"use client"
import * as React from "react"
import dynamic from "next/dynamic"
import { Menu } from "lucide-react"
import { focusRing } from "./focus"

const MobileMenuSheet = dynamic(() => import("./mobile-menu"), { ssr: false })

const FULL = 80
const COMPACT = 64
/** Scroll distance over which the header eases from full to compact. */
const RANGE = 64

/** Writes scroll progress through the first RANGE px (0 to 1) to `--hp` on the element, once per frame. */
function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const update = () => {
      frame = 0
      el.style.setProperty("--hp", String(Math.min(1, Math.max(0, window.scrollY / RANGE))))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [ref])
}

/** The visible header bar: its height eases 80 → 64 px over the first 64 px of scroll (via `--hp`). */
export function HeaderBar({ children }: { children: React.ReactNode }) {
  const bar = React.useRef<HTMLDivElement>(null)
  useScrollProgress(bar)
  return (
    <div ref={bar} style={{ height: `calc(${FULL}px - ${FULL - COMPACT}px * var(--hp, 0))` }} className="absolute inset-x-0 top-0 bg-white/90 supports-backdrop-filter:backdrop-blur-xl">
      {children}
      {/* Hairline fades in over the second half of the range */}
      <span aria-hidden style={{ opacity: "clamp(0, calc(var(--hp, 0) * 2 - 1), 1)" }} className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line" />
    </div>
  )
}

/** The menu button is plain markup; the sheet (and its dialog code) loads on first tap. */
export function MobileMenu({ nav }: { nav: readonly { label: string; href: string }[] }) {
  const [open, setOpen] = React.useState(false)
  const [used, setUsed] = React.useState(false)
  const trigger = React.useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setUsed(true)
          setOpen(true)
        }}
        className={`-mr-2 inline-flex size-12 items-center justify-center rounded-full text-navy hover:bg-sky md:hidden ${focusRing}`}
      >
        <Menu className="size-6" aria-hidden />
      </button>
      {used && <MobileMenuSheet nav={nav} open={open} onOpenChange={setOpen} returnFocus={trigger} />}
    </>
  )
}
