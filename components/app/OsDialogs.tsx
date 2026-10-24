"use client"
import * as React from "react"
import { createPortal } from "react-dom"
import { Apple } from "lucide-react"
import { Mark } from "@/components/brand/Mark"
import { cn } from "@/lib/utils"

const noop = () => () => {}
function useRoot() {
  return React.useSyncExternalStore(noop, () => document.getElementById("phone-overlay") ?? document.body, () => null)
}

/** iOS-style system alert, clearly a mock of the OS. */
export function OsAlert({ open, title, body, actions }: { open: boolean; title: string; body?: string; actions: { label: string; onClick: () => void; bold?: boolean }[] }) {
  const root = useRoot()
  if (!open || !root) return null
  return createPortal(
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/35 p-10 animate-fade-in" role="alertdialog" aria-modal aria-label={title}>
      <div className="w-[270px] overflow-hidden rounded-[14px] bg-[#F2F2F7]/95 text-center backdrop-blur">
        <div className="px-4 pb-4 pt-5">
          <span className="mx-auto mb-2 inline-flex size-10 items-center justify-center rounded-[10px] bg-blue">
            <Mark size={28} variant="white" />
          </span>
          <p className="text-[17px] font-semibold leading-snug text-black">{title}</p>
          {body && <p className="mt-1 text-[13px] leading-snug text-black/80">{body}</p>}
        </div>
        <div className="flex flex-col">
          {actions.map((a) => (
            <button key={a.label} type="button" onClick={a.onClick} className={cn("h-11 border-t border-black/15 text-[17px] text-[#007AFF] hover:bg-black/5", a.bold && "font-semibold")}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    root,
  )
}

/** Mock OS account sheet for Sign in with Apple / Google. */
export function OsAuthSheet({
  open,
  provider,
  onCancel,
  children,
}: {
  open: boolean
  provider: "apple" | "google"
  onCancel: () => void
  children: React.ReactNode
}) {
  const root = useRoot()
  if (!open || !root) return null
  return createPortal(
    <div className="absolute inset-0 z-[90] flex flex-col justify-end bg-black/40 animate-fade-in" role="dialog" aria-modal aria-label={`Sign in to Answerd with ${provider === "apple" ? "Apple" : "Google"}`}>
      <div className="rounded-t-[14px] bg-[#F2F2F7] px-4 pb-8 pt-3 animate-sheet-up">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-black">
            {provider === "apple" ? <Apple className="size-4" aria-hidden /> : <span className="text-[15px] font-bold text-[#4285F4]">G</span>}
            {provider === "apple" ? "Apple ID" : "Google"}
          </span>
          <button type="button" onClick={onCancel} className="h-11 px-2 text-[17px] text-[#007AFF]">
            Cancel
          </button>
        </div>
        <div className="mt-2 flex flex-col items-center text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-[14px] bg-blue">
            <Mark size={38} variant="white" />
          </span>
          <p className="mt-3 text-[20px] font-semibold text-black">Sign in to Answerd with {provider === "apple" ? "Apple" : "Google"}</p>
          <p className="mt-1 text-[12px] text-black/50">Prototype: no real account is used</p>
        </div>
        <div className="mt-4 space-y-2">{children}</div>
      </div>
    </div>,
    root,
  )
}

export function OsRow({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full flex-col items-start justify-center rounded-xl bg-white px-4 py-2 text-left hover:bg-white/70">
      <span className="text-[16px] text-black">{title}</span>
      {subtitle && <span className="text-[13px] text-black/50">{subtitle}</span>}
    </button>
  )
}
