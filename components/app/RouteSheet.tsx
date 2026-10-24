"use client"
import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/** A screen that is itself a bottom sheet (C-05, C-14, C-20, C-45): dimmed backdrop plus sheet. */
export function RouteSheet({
  title,
  onClose,
  children,
  footer,
  backdrop,
  className,
  hideTitle,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  backdrop?: React.ReactNode
  className?: string
  hideTitle?: boolean
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        {backdrop}
      </div>
      <button type="button" tabIndex={-1} aria-label="Close" className="absolute inset-0 bg-navy/45 animate-fade-in" onClick={onClose} />
      <div role="dialog" aria-modal aria-label={title} className={cn("absolute inset-x-0 bottom-0 flex max-h-[92%] flex-col rounded-t-3xl bg-white shadow-overlay animate-sheet-up", className)}>
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>
        <div className={cn("flex items-center justify-between gap-2 px-4 pt-1", hideTitle && "justify-end")}>
          {!hideTitle && <h1 className="t-heading">{title}</h1>}
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">{children}</div>
        {footer && <div className="border-t border-line px-4 pb-6 pt-3">{footer}</div>}
      </div>
    </div>
  )
}
