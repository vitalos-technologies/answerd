"use client"
import * as React from "react"
import { create } from "zustand"
import { usePathname } from "next/navigation"
import { screenById, screenForPath } from "@/lib/screens"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export const useScreenMeta = create<{ id: string | null; set: (id: string | null) => void }>((set) => ({ id: null, set: (id) => set({ id }) }))

/** Pages declare their screen ID (needed where two IDs share a route, e.g. C-16 and C-17). */
export function ScreenMeta({ id }: { id: string }) {
  const set = useScreenMeta((s) => s.set)
  React.useEffect(() => {
    set(id)
    return () => set(null)
  }, [id, set])
  return null
}

export function useCurrentScreen() {
  const pathname = usePathname()
  const id = useScreenMeta((s) => s.id)
  return id ? screenById(id) : screenForPath(pathname)
}

export function ScreenIdBadge({ className, idOverride }: { className?: string; idOverride?: string }) {
  const show = useStore((s) => s.showScreenIds)
  const current = useCurrentScreen()
  const screen = idOverride ? screenById(idOverride) : current
  if (!show || !screen) return null
  return (
    <span
      className={cn("pointer-events-none z-[70] inline-flex h-6 items-center rounded-md bg-navy/90 px-2 font-mono text-[11px] font-semibold tracking-wide text-white shadow-card", className)}
      title={`${screen.id} ${screen.title}`}
      data-screen-id={screen.id}
    >
      {screen.id}
    </span>
  )
}
