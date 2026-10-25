"use client"
import { X } from "lucide-react"
import { focusRing } from "./focus"

export const SMART_BANNER_KEY = "answerd-sb-off"

/** Hides the smart banner for this session (CSS reads html[data-sb-off]). */
export function SmartBannerClose({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        document.documentElement.dataset.sbOff = ""
        try {
          sessionStorage.setItem(SMART_BANNER_KEY, "1")
        } catch {
          /* storage blocked: hidden for this page view */
        }
      }}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-ink hover:bg-sky ${focusRing}`}
    >
      <X className="size-4" aria-hidden />
    </button>
  )
}
