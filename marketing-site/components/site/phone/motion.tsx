"use client"
import * as React from "react"
import { useShownOnce } from "../reveal"

/* Small client-only wrappers for the phone mockups. The movement is CSS (see globals.css); everything else
   stays server-rendered. All of it is off under reduced motion. */

/**
 * Gentle 4 s float (6 px) plus a slight scroll parallax on desktop (>= 1024 px).
 * The rise-in is a CSS animation on the parent (no JS needed to paint).
 */
export function PhoneFloat({ children, className, parallax = 0.06, delay = 0.9 }: { children: React.ReactNode; className?: string; parallax?: number; delay?: number }) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el || parallax <= 0) return
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)")
    let frame = 0
    const update = () => {
      frame = 0
      el.style.transform = mq.matches ? `translateY(${-Math.min(window.scrollY, 900) * parallax}px)` : ""
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    mq.addEventListener("change", update)
    return () => {
      window.removeEventListener("scroll", onScroll)
      mq.removeEventListener("change", update)
      cancelAnimationFrame(frame)
    }
  }, [parallax])

  return (
    <div ref={ref} className={className}>
      <div className="anim-float" style={{ animationDelay: `${delay}s` }}>
        {children}
      </div>
    </div>
  )
}

/** Small floating card offset: drifts a little out of phase with the phone. */
export function Drift({ children, className, delay = 0, distance = 5 }: { children: React.ReactNode; className?: string; delay?: number; distance?: number }) {
  return (
    <div className={className}>
      <div className="anim-drift" style={{ animationDelay: `${delay}s`, "--drift": `${distance}px` } as React.CSSProperties}>
        {children}
      </div>
    </div>
  )
}

/**
 * Ask Answerd: a typing indicator, then the reply bubble, then suggestion chips, once, when scrolled into view.
 * Under reduced motion the bubble and chips are simply there.
 */
export function AskConversation({ avatar, bubble, chips }: { avatar: React.ReactNode; bubble: string; chips: readonly string[] }) {
  const ref = React.useRef<HTMLDivElement>(null)
  useShownOnce(ref, "0px 0px -40px 0px")

  return (
    <div ref={ref} data-ask="">
      <div className="flex items-end gap-[8px]">
        {avatar}
        <div className="grid min-w-0 flex-1">
          {/* Typing indicator */}
          <div className="ask-typing col-start-1 row-start-1 self-end">
            <span className="inline-flex h-[34px] items-center gap-[4px] rounded-[18px] rounded-bl-[6px] bg-teal-tint px-[13px] ring-1 ring-teal/15">
              {[0, 1, 2].map((i) => (
                <span key={i} className="ask-dot size-[6px] rounded-full bg-teal-ink" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </span>
          </div>
          {/* Reply */}
          <div className="ask-reply col-start-1 row-start-1">
            <div className="rounded-[18px] rounded-bl-[6px] bg-teal-tint px-[13px] py-[9px] text-[13.5px] leading-[19px] text-navy ring-1 ring-teal/15">{bubble}</div>
          </div>
        </div>
      </div>
      <div className="mt-[10px] flex flex-wrap gap-[6px] pl-[36px]">
        {chips.map((c, i) => (
          <span
            key={c}
            className="ask-chip inline-flex h-[28px] items-center rounded-full border border-blue/25 bg-white px-[10px] text-[11.5px] font-semibold text-blue"
            style={{ "--d": `${1.8 + i * 0.08}s` } as React.CSSProperties}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}
