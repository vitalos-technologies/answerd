"use client"
import * as React from "react"
import { useBiz } from "@/components/app/biz"

/**
 * The business the viewer is working in, their role, and whether they are staff
 * (staff see only their own jobs plus the shared inbox). Opening a business screen
 * switches the session to business mode, as tapping a business notification does.
 */
export function useOps() {
  const ctx = useBiz()
  const { s, biz, role } = ctx
  const userId = s.session.userId
  const staff = role === "staff"
  const { hydrated, setMode } = s
  const mode = s.session.mode
  React.useEffect(() => {
    if (hydrated && biz && (role === "owner" || role === "staff") && mode !== "business") setMode("business", biz.id)
  }, [hydrated, biz, role, mode, setMode])
  return { ...ctx, userId, staff, staffUserId: staff ? userId : null, actor: (staff ? "staff" : "owner") as "staff" | "owner" }
}

export type OpsCtx = ReturnType<typeof useOps>
