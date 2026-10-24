"use client"
import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/** Finds the overlay root: inside the phone frame when there is one, else the body. */
const noopSubscribe = () => () => {}
function useOverlayRoot() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => document.getElementById("phone-overlay") ?? document.body,
    () => null,
  )
}

/** White, 24 top radius, grabber, title row with close. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  inline,
  labelledBy,
}: {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  /** Render in place (used for route-based sheets and the component gallery). */
  inline?: boolean
  labelledBy?: string
}) {
  const root = useOverlayRoot()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("button, a, input, textarea, select")?.focus(), 50)
    return () => {
      window.removeEventListener("keydown", onKey)
      clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null
  const inFrame = root?.id === "phone-overlay"
  const sheet = (
    <div className={cn(inline ? "relative" : "absolute inset-0 z-50 flex flex-col justify-end", !inline && !inFrame && "fixed")}>
      {!inline && <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-navy/40 animate-fade-in" onClick={onClose} />}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={!inline}
        aria-labelledby={title ? titleId : labelledBy}
        className={cn(
          "relative mx-auto flex max-h-[88%] w-full max-w-[520px] flex-col rounded-t-3xl bg-white shadow-overlay",
          !inline && "animate-sheet-up",
          inline && "max-h-none border border-line",
          className,
        )}
      >
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>
        {title !== undefined && (
          <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-1.5">
            <h2 id={titleId} className="t-heading">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky">
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer && <div className="border-t border-line px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
  if (inline) return sheet
  if (!root) return null
  return createPortal(sheet, root)
}
