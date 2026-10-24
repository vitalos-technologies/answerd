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
  if (id) return screenById(id)
  // The hub is prototype chrome, not a screen in the spec
  return pathname.startsWith("/hub") ? undefined : screenForPath(pathname)
}

const noSubscribe = () => () => {}

/** ?clean=1 hides the prototype chrome (hub button, screen ID badge) for screenshots. */
function useCleanMode() {
  return React.useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(window.location.search).get("clean") === "1",
    () => false,
  )
}

export function ScreenIdBadge({ className, idOverride }: { className?: string; idOverride?: string }) {
  const show = useStore((s) => s.showScreenIds)
  const current = useCurrentScreen()
  const clean = useCleanMode()
  const screen = idOverride ? screenById(idOverride) : current
  if (!show || clean || !screen) return null
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
