"use client"
import * as React from "react"
import { Button } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { OTPInput, ResendTimer } from "@/components/answerd/OTPInput"
import { useStore } from "@/lib/store"
import { maskPhone } from "@/lib/format"
import { toast } from "@/lib/toast"

/**
 * SMS re-check for sensitive business actions (billing, transfer, unpublish, delete). Sends a 6-digit code to
 * the signed-in user's mobile; five wrong codes lock that number for 15 minutes. In the prototype any code
 * except 000000 works.
 */
export function SmsConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  destructive,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body?: React.ReactNode
  confirmLabel: string
  destructive?: boolean
}) {
  const phone = useStore((s) => s.users.find((u) => u.id === s.session.userId)?.phone ?? "")
  const recordFailedCode = useStore((s) => s.recordFailedCode)
  const clearFailedCodes = useStore((s) => s.clearFailedCodes)
  const lockedUntil = useStore((s) => s.session.lockedUntil[phone])
  const clock = useStore((s) => s.clock)
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState("")
  const locked = !!lockedUntil && new Date(lockedUntil).getTime() > new Date(clock).getTime()

  const close = () => {
    setCode("")
    setError("")
    onClose()
  }
  const submit = () => {
    if (code.length < 6) {
      setError("Enter the 6-digit code")
      return
    }
    if (code === "000000") {
      const r = recordFailedCode(phone)
      setCode("")
      setError(r.locked ? "Too many wrong codes. Try again in 15 minutes." : `That code didn't match. ${5 - r.attempts} ${5 - r.attempts === 1 ? "try" : "tries"} left.`)
      return
    }
    clearFailedCodes(phone)
    setCode("")
    setError("")
    onConfirm()
  }

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={title}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={close}>
            Cancel
          </Button>
          <Button variant={destructive ? "destructive" : "primary"} className="flex-[1.4]" onClick={submit} disabled={locked || code.length < 6}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {body && <div className="t-body text-slate">{body}</div>}
      <p className="mt-3 t-label font-normal text-slate">
        To confirm it&apos;s you, we sent a 6-digit code to <span className="text-navy tnum">{phone ? maskPhone(phone) : "your mobile"}</span>.
      </p>
      <div className="mt-3">
        <OTPInput value={code} onChange={(v) => (setCode(v), setError(""))} error={!!error} disabled={locked} label="SMS code" />
      </div>
      {(error || locked) && (
        <p role="alert" className="mt-2 t-caption text-red">
          {locked ? "Too many wrong codes. Try again in 15 minutes." : error}
        </p>
      )}
      <div className="mt-3">
        <ResendTimer onResend={() => toast("New code sent")} />
      </div>
    </BottomSheet>
  )
}
