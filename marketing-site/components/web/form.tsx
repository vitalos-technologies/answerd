// Small form primitives for the client flows (claim, sign-in, billing, review). No copy lives here.
import * as React from "react"
import { FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"
import { focusRing } from "@/components/site/focus"

export const inputCls =
  "h-12 w-full min-w-0 rounded-xl border border-line bg-white px-4 text-base text-navy placeholder:text-muted-ink transition-colors hover:border-navy/30 focus-visible:border-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue aria-[invalid=true]:border-red"

export const btnPrimary = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue px-6 text-base font-semibold whitespace-nowrap text-white transition-colors duration-150 hover:bg-blue-hover disabled:cursor-not-allowed disabled:bg-sky disabled:text-muted-ink [&_svg]:size-5 [&_svg]:shrink-0",
  focusRing,
)
export const btnSecondary = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-white px-6 text-base font-semibold whitespace-nowrap text-navy transition-colors duration-150 hover:bg-sky disabled:cursor-not-allowed disabled:text-muted-ink [&_svg]:size-5 [&_svg]:shrink-0",
  focusRing,
)
export const linkCls = cn("rounded-sm font-semibold text-blue underline underline-offset-2 hover:text-blue-hover", focusRing)

export function Field({ label, htmlFor, hint, error, optional, className, children }: { label: string; htmlFor: string; hint?: string; error?: string; optional?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[15px] leading-5 font-semibold text-navy">
        {label} {optional && <span className="font-normal text-muted-ink">{optional}</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-msg`} role="alert" className="text-[14px] leading-5 text-red">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-msg`} className="text-[14px] leading-5 text-muted-ink">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Amber pill that marks a mock flow as a prototype. */
export function PrototypeLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex min-h-9 items-center gap-2 rounded-full bg-amber-tint px-3.5 py-1 text-[14px] leading-5 font-semibold text-amber-ink">
      <FlaskConical className="size-4 shrink-0" aria-hidden /> {children}
    </p>
  )
}

export function Note({ tone = "info", title, children, className }: { tone?: "info" | "success" | "error" | "warning"; title?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "rounded-xl p-4 text-[15px] leading-6 text-navy",
        tone === "info" && "bg-blue-tint",
        tone === "success" && "bg-teal-tint",
        tone === "error" && "bg-red-tint",
        tone === "warning" && "bg-amber-tint",
        className,
      )}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && "mt-0.5", "text-slate")}>{children}</div>}
    </div>
  )
}

/** Six-digit code as one input: one-time-code autofill, paste and screen readers all just work. */
export function CodeInput({ id, value, onChange, invalid, describedBy }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean; describedBy?: string }) {
  return (
    <input
      id={id}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(inputCls, "tnum h-14 max-w-[240px] text-center text-2xl font-semibold tracking-[0.5em]")}
    />
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("card-site p-6 md:p-8", className)}>{children}</div>
}
