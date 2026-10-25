"use client"
import * as React from "react"

/*
 * Scroll reveals without an animation library: an IntersectionObserver sets `data-shown` once, and CSS in
 * globals.css does the fade and 12 px rise (0.3 s, all done within 400 ms). Reduced
 * motion and no-JS both show content immediately.
 */

type DivProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Sets `data-shown` on the element the first time 15% of it is in view (a small negative bottom margin keeps
 * it from firing on the last pixel). Tall elements can't reach 15% of themselves until well on screen, so
 * they also count as shown once they fill 15% of the viewport.
 */
export function useShownOnce(ref: React.RefObject<HTMLElement | null>, rootMargin = "0px 0px -24px 0px") {
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const enough = entry.intersectionRatio >= 0.15 || entry.intersectionRect.height >= window.innerHeight * 0.15
        if (!enough) return
        el.dataset.shown = ""
        io.disconnect()
      },
      { rootMargin, threshold: [0, 0.05, 0.1, 0.15] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
}

/** Section reveal: opacity plus a 16 px rise, once. */
export function Reveal({ children, delay = 0, style, ...rest }: { children: React.ReactNode; delay?: number } & DivProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  useShownOnce(ref)
  return (
    <div ref={ref} data-reveal="" style={delay ? ({ ...style, "--reveal-delay": `${delay}s` } as React.CSSProperties) : style} {...rest}>
      {children}
    </div>
  )
}

/** Parent for staggered children (tiles, cards): each StaggerItem inside rises in turn. */
export function Stagger({ children, stagger = 0.06, style, ...rest }: { children: React.ReactNode; stagger?: number } & DivProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  useShownOnce(ref)
  React.useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>("[data-stagger-item]").forEach((item, i) => item.style.setProperty("--i", String(i)))
  }, [])
  return (
    <div ref={ref} data-stagger="" style={{ ...style, "--stagger": `${stagger}s` } as React.CSSProperties} {...rest}>
      {children}
    </div>
  )
}

export function StaggerItem({ children, ...rest }: { children: React.ReactNode } & DivProps) {
  return (
    <div data-stagger-item="" {...rest}>
      {children}
    </div>
  )
}
