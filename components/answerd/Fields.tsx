"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

export function Field({ label, hint, error, children, htmlFor, optional, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; htmlFor?: string; optional?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="t-label text-navy">
        {label}
        {optional && <span className="font-normal text-muted-ink"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="t-caption text-red" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="t-caption text-muted-ink">{hint}</p>
      ) : null}
    </div>
  )
}

export const inputCls =
  "h-12 w-full rounded-[12px] border border-line bg-white px-3.5 t-body text-navy outline-none transition-[border-color,box-shadow] placeholder:text-muted-ink focus:border-blue focus:ring-3 focus:ring-blue/20 aria-invalid:border-red aria-invalid:ring-red/15 disabled:bg-sky disabled:text-muted-ink"

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputCls, className)} {...props} />
})

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputCls, "h-auto min-h-24 py-3", className)} {...props} />
})

export function SelectInput({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputCls, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 fill=%22none%22 stroke=%22%230F2D5B%22 stroke-width=%221.75%22><path d=%22m6 8 4 4 4-4%22/></svg>')] bg-[right_12px_center] bg-no-repeat pr-10", className)} {...props}>
      {children}
    </select>
  )
}

export function ToggleRow({ label, description, checked, onChange, disabled, id }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; id?: string }) {
  const auto = React.useId()
  const sid = id ?? auto
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-2">
      <label htmlFor={sid} className="min-w-0 flex-1 cursor-pointer">
        <span className="block t-label text-navy">{label}</span>
        {description && <span className="block t-caption text-muted-ink">{description}</span>}
      </label>
      <Switch id={sid} checked={checked} onCheckedChange={onChange} disabled={disabled} className="data-[state=checked]:bg-blue" />
    </div>
  )
}

export function CheckRow({ label, checked, onChange, description }: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-blue" />
      <span>
        <span className="block t-label font-normal text-navy">{label}</span>
        {description && <span className="block t-caption text-muted-ink">{description}</span>}
      </span>
    </label>
  )
}

export function Chip({ active, onClick, children, className, ...rest }: { active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 t-label transition-colors duration-150 [&_svg]:size-4",
        active ? "border-blue bg-blue-tint text-blue" : "border-line bg-white text-navy hover:border-blue/50",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...props}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="t-heading">{children}</h2>
      {action}
    </div>
  )
}
