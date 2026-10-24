import type * as React from "react"
import { cn } from "@/lib/utils"
import { site } from "@/content/site"

/*
 * iPhone-style device frame drawn in CSS. Screens are laid out at a fixed logical size
 * (SCREEN_W x SCREEN_H) and the whole device is scaled with a transform, so text stays vector-crisp
 * and the outer box reserves its exact size (no layout shift).
 */
export const SCREEN_W = 320
export const SCREEN_H = 694
const RIM = 3
const BEZEL = 9
export const DEVICE_W = SCREEN_W + (RIM + BEZEL) * 2 // 344
export const DEVICE_H = SCREEN_H + (RIM + BEZEL) * 2 // 718

/** Brushed titanium edge. */
export const TITANIUM =
  "linear-gradient(145deg,#e9ebef 0%,#a7adb6 18%,#f4f5f7 34%,#8d939c 52%,#d5d8dd 70%,#7e848d 86%,#c9cdd3 100%)"

/** Responsive outer width in CSS px; `md`/`lg` override at those breakpoints. */
export type PhoneSize = number | { base: number; md?: number; lg?: number }

export function Phone({
  size = 320,
  label,
  children,
  className,
  screenClassName,
  statusTone = "dark",
}: {
  size?: PhoneSize
  /** Status bar colour: "light" over dark covers. */
  statusTone?: "dark" | "light"
  /** One descriptive label for the whole device (it is exposed as a single image). */
  label: string
  children: React.ReactNode
  className?: string
  screenClassName?: string
}) {
  const s = typeof size === "number" ? { base: size } : size
  const md = s.md ?? s.base
  const lg = s.lg ?? md
  const vars = {
    "--ps-base": s.base / DEVICE_W,
    "--ps-md": md / DEVICE_W,
    "--ps-lg": lg / DEVICE_W,
    width: `calc(${DEVICE_W}px * var(--ps))`,
    height: `calc(${DEVICE_H}px * var(--ps))`,
  } as React.CSSProperties

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative shrink-0 select-none [--ps:var(--ps-base)] md:[--ps:var(--ps-md)] lg:[--ps:var(--ps-lg)]", className)}
      style={vars}
    >
      <div aria-hidden className="absolute top-0 left-0 origin-top-left" style={{ width: DEVICE_W, height: DEVICE_H, transform: "scale(var(--ps))" }}>
        {/* Side buttons */}
        <SideButton side="left" top={118} height={30} />
        <SideButton side="left" top={170} height={56} />
        <SideButton side="left" top={236} height={56} />
        <SideButton side="right" top={190} height={88} />
        {/* Titanium rim */}
        <div
          className="relative size-full rounded-[58px]"
          style={{
            padding: RIM,
            background: TITANIUM,
            boxShadow:
              "0 50px 100px -30px rgba(15,45,91,.38), 0 28px 50px -24px rgba(15,45,91,.32), inset 0 0 0 1px rgba(255,255,255,.55), inset 0 0 0 2px rgba(15,23,42,.12)",
          }}
        >
          {/* Black bezel */}
          <div className="relative size-full rounded-[55px] bg-[#0b0d12]" style={{ padding: BEZEL, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)" }}>
            {/* Screen */}
            <div
              className={cn("relative overflow-hidden rounded-[46px] bg-white text-navy antialiased", screenClassName)}
              style={{ width: SCREEN_W, height: SCREEN_H }}
            >
              {children}
              <StatusBar tone={statusTone} />
              <div className="absolute top-[11px] left-1/2 z-30 h-[31px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
              <div className="absolute bottom-[8px] left-1/2 z-30 h-[5px] w-[124px] -translate-x-1/2 rounded-full bg-navy/90" />
              {/* Glass sheen */}
              <div className="pointer-events-none absolute inset-0 z-40 rounded-[46px] bg-[linear-gradient(115deg,rgba(255,255,255,.14)_0%,rgba(255,255,255,0)_38%)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SideButton({ side, top, height }: { side: "left" | "right"; top: number; height: number }) {
  return (
    <span
      className={cn("absolute w-[4px]", side === "left" ? "-left-[2.5px] rounded-l-[3px]" : "-right-[2.5px] rounded-r-[3px]")}
      style={{ top, height, background: "linear-gradient(90deg,#8d939c,#e3e5e9 50%,#8d939c)" }}
    />
  )
}

/** iOS-style status bar: 9:41, signal, Wi-Fi and battery. */
export function StatusBar({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const fg = tone === "dark" ? "#0b1220" : "#ffffff"
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[52px] items-center justify-between pr-[26px] pl-[34px] pt-[2px]", className)} style={{ color: fg }}>
      <span className="text-[15px] font-semibold tracking-[-0.01em] tnum">{site.demo.time}</span>
      <span className="flex items-center gap-[5px]">
        <svg width="17" height="11" aria-hidden>
          <use href="#sb-signal" />
        </svg>
        <svg width="15" height="11" aria-hidden>
          <use href="#sb-wifi" />
        </svg>
        <svg width="26" height="12" aria-hidden>
          <use href="#sb-battery" />
        </svg>
      </span>
    </div>
  )
}

/**
 * The top of a phone peeking up from the bottom of a card, for small screen snippets.
 * Laid out at 1:1 (no scaling); the parent clips it with overflow-hidden.
 */
export function PhoneCrop({ label, children, className, width = 324 }: { label: string; children: React.ReactNode; className?: string; width?: number }) {
  return (
    <div role="img" aria-label={label} className={cn("relative select-none", className)} style={{ width }}>
      <div
        aria-hidden
        className="rounded-t-[46px] pb-0"
        style={{
          padding: `${RIM}px ${RIM}px 0`,
          background: TITANIUM,
          boxShadow: "0 30px 60px -20px rgba(15,45,91,.3), 0 12px 24px -12px rgba(15,45,91,.22)",
        }}
      >
        <div className="rounded-t-[43px] bg-[#0b0d12]" style={{ padding: `${BEZEL - 1}px ${BEZEL - 1}px 0` }}>
          <div className="relative h-[340px] overflow-hidden rounded-t-[35px] bg-white text-navy antialiased">
            <StatusBar className="h-[46px] pr-[24px] pl-[30px]" />
            <div className="absolute top-[10px] left-1/2 z-30 h-[26px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
            <div className="absolute inset-x-0 top-[50px] bottom-0">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Status bar glyphs as <symbol>s, rendered once by the root layout and drawn in currentColor. */
export function StatusBarSprite() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
      <symbol id="sb-signal" viewBox="0 0 17 11" fill="currentColor">
        <rect x="0" y="7" width="3" height="4" rx="1" />
        <rect x="4.5" y="5" width="3" height="6" rx="1" />
        <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
        <rect x="13.5" y="0" width="3" height="11" rx="1" />
      </symbol>
      <symbol id="sb-wifi" viewBox="0 0 15 11" fill="currentColor">
        <path d="M7.5 2.3c2.06 0 3.94.8 5.33 2.1l1.07-1.1A9.13 9.13 0 0 0 7.5.75 9.13 9.13 0 0 0 1.1 3.3l1.07 1.1A7.6 7.6 0 0 1 7.5 2.3Z" />
        <path d="M7.5 5.35c1.24 0 2.37.48 3.21 1.25l1.08-1.1A6.06 6.06 0 0 0 7.5 3.8c-1.66 0-3.16.65-4.29 1.7l1.08 1.1A4.6 4.6 0 0 1 7.5 5.35Z" />
        <path d="M9.63 7.7a3.05 3.05 0 0 0-4.26 0L7.5 9.9l2.13-2.2Z" />
      </symbol>
      <symbol id="sb-battery" viewBox="0 0 26 12" fill="none">
        <rect x="0.5" y="0.5" width="22" height="11" rx="3.5" stroke="currentColor" opacity=".4" />
        <rect x="2" y="2" width="19" height="8" rx="2.2" fill="currentColor" />
        <path d="M24 4.2v3.6c.7-.25 1.2-.95 1.2-1.8s-.5-1.55-1.2-1.8Z" fill="currentColor" opacity=".45" />
      </symbol>
    </svg>
  )
}
