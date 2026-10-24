"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

/** Six 48 boxes, auto-advance, paste fills all. Announced as one group. */
export function OTPInput({ value, onChange, onComplete, error, disabled, autoFocus = true, label = "6-digit code" }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; error?: boolean; disabled?: boolean; autoFocus?: boolean; label?: string }) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "")

  const set = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, 6)
    onChange(clean)
    if (clean.length === 6) onComplete?.(clean)
  }

  return (
    <div role="group" aria-label={label} className={cn("flex justify-between gap-2", error && "animate-shake")}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={d}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of 6`}
          aria-invalid={error || undefined}
          maxLength={1}
          className={cn(
            "size-12 rounded-[12px] border bg-white text-center text-[22px] font-semibold text-navy tnum outline-none transition-[border-color,box-shadow] focus:border-blue focus:ring-3 focus:ring-blue/20",
            error ? "border-red" : d ? "border-navy/30" : "border-line",
          )}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "")
            if (!v) return
            if (v.length > 1) {
              set(v)
              refs.current[Math.min(5, v.length)]?.focus()
              return
            }
            const arr = digits.slice()
            arr[i] = v
            set(arr.join(""))
            refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault()
              const arr = digits.slice()
              if (arr[i]) arr[i] = ""
              else if (i > 0) {
                arr[i - 1] = ""
                refs.current[i - 1]?.focus()
              }
              onChange(arr.join("").replace(/\s/g, ""))
            } else if (e.key === "ArrowLeft") refs.current[i - 1]?.focus()
            else if (e.key === "ArrowRight") refs.current[i + 1]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            const v = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
            set(v)
            refs.current[Math.min(5, v.length)]?.focus()
          }}
        />
      ))}
    </div>
  )
}

/** "Resend in 0:30" countdown in real seconds. */
export function ResendTimer({ seconds = 30, onResend }: { seconds?: number; onResend: () => void }) {
  const [left, setLeft] = React.useState(seconds)
  React.useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  if (left > 0)
    return (
      <p className="t-label font-normal text-muted-ink tnum" aria-live="polite">
        Resend in 0:{String(left).padStart(2, "0")}
      </p>
    )
  return (
    <button
      type="button"
      className="t-label text-blue hover:underline"
      onClick={() => {
        onResend()
        setLeft(seconds)
      }}
    >
      Resend code
    </button>
  )
}
