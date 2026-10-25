"use client"
// S-09: the amber bar on every app screen during a read-only "view as customer". Kept apart from live.tsx,
// which imports AppScreen, so AppScreen can import this without a cycle.
import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { useStore } from "@/lib/store"
import { fmtTime } from "@/lib/time"

/** Amber bar on every app screen during a read-only "view as customer". */
export function CustomerViewBar() {
  const imp = useStore((s) => s.session.impersonation)
  const router = useRouter()
  if (!imp || imp.kind !== "customer") return null
  return (
    <p className="flex shrink-0 items-center justify-center gap-2 bg-amber px-3 py-1 text-center t-caption text-navy">
      <Eye className="size-3.5 shrink-0" aria-hidden />
      <span>
        Viewing as {imp.label} (audited) · read only · ends {fmtTime(imp.until)}
      </span>
      <button
        type="button"
        onClick={() => {
          useStore.getState().endImpersonation()
          router.push("/admin/super/impersonate")
        }}
        className="inline-flex min-h-6 items-center font-semibold underline underline-offset-2"
      >
        Exit
      </button>
    </p>
  )
}

