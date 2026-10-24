"use client"
import * as React from "react"
import { Smartphone } from "lucide-react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const GetAppDialog = dynamic(() => import("./get-app-dialog"), { ssr: false })

export type GetAppCopy = { label: string; dialogTitle: string; dialogBody: string; appStoreUrl: string; playStoreUrl: string }

const Ctx = React.createContext<{ open: () => void; label: string }>({ open: () => {}, label: "" })

/**
 * "Get the app": on desktop a dialog with the QR code and both badges; on a phone, straight to the right
 * store by user agent, falling back to the dialog with both badges while the store links aren't live.
 */
export function GetAppProvider({ qr, copy, children }: { qr: React.ReactNode; copy: GetAppCopy; children: React.ReactNode }) {
  const [isOpen, setOpen] = React.useState(false)
  // The dialog mounts on first open and stays mounted so its close animation can run
  const [used, setUsed] = React.useState(false)
  const open = React.useCallback(() => {
    const ua = navigator.userAgent
    const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    const android = /Android/i.test(ua)
    const target = ios ? copy.appStoreUrl : android ? copy.playStoreUrl : null
    if (target && target.startsWith("http")) {
      window.location.href = target
      return
    }
    setUsed(true)
    setOpen(true)
  }, [copy.appStoreUrl, copy.playStoreUrl])
  const value = React.useMemo(() => ({ open, label: copy.label }), [open, copy.label])
  return (
    <Ctx.Provider value={value}>
      {children}
      {used && <GetAppDialog title={copy.dialogTitle} body={copy.dialogBody} open={isOpen} onOpenChange={setOpen} qr={qr} />}
    </Ctx.Provider>
  )
}

export function useGetApp() {
  return React.useContext(Ctx)
}

/** The pill that opens Get the app. `variant` "primary" is the blue action; "secondary" is outlined. */
export function GetAppButton({ className, variant = "primary", label, icon = false, size = "md" }: { className?: string; variant?: "primary" | "secondary" | "white"; label?: string; icon?: boolean; size?: "md" | "sm" }) {
  const ctx = useGetApp()
  return (
    <button
      type="button"
      onClick={ctx.open}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
        size === "md" ? "h-12 px-6 text-base" : "h-10 px-5 text-[15px]",
        variant === "primary" && "bg-blue text-white hover:bg-blue-hover",
        variant === "secondary" && "border border-line bg-white text-navy hover:bg-sky",
        variant === "white" && "bg-white text-navy hover:bg-blue-tint",
        className,
      )}
    >
      {icon && <Smartphone className="size-[18px]" aria-hidden />}
      {label ?? ctx.label}
    </button>
  )
}
