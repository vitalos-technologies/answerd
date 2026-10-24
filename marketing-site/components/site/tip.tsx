"use client"
import * as React from "react"

/**
 * Lightweight tooltip: shown on hover and keyboard focus with CSS, linked by aria-describedby, and
 * dismissible with Escape (WCAG 1.4.13). Stays visible while the pointer is over it.
 * It positions against the nearest `relative` ancestor (the trust item) and takes that item's width, so it
 * never runs off a narrow screen; while hidden it is display:none, so it adds no overflow.
 */
export function Tip({ label, tip, children, className }: { label: string; tip: string; children: React.ReactNode; className?: string }) {
  const id = React.useId()
  const [hidden, setHidden] = React.useState(false)
  return (
    <span className="group/tip inline-flex" onPointerLeave={() => setHidden(false)} onBlur={() => setHidden(false)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        onKeyDown={(e) => e.key === "Escape" && setHidden(true)}
        className={className}
      >
        {children}
      </button>
      <span
        role="tooltip"
        id={id}
        data-hidden={hidden || undefined}
        className="absolute bottom-full left-0 z-30 mb-2 hidden w-full max-w-[260px] rounded-lg bg-navy px-3 py-2 text-[13px] leading-[18px] text-white shadow-lift transition-[opacity,display] transition-discrete duration-150 group-hover/tip:block group-has-[:focus-visible]/tip:block starting:opacity-0 motion-reduce:transition-none data-hidden:!hidden"
      >
        {tip}
      </span>
    </span>
  )
}
