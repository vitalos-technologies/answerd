"use client"
import * as React from "react"
import { PhoneIncoming } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { OTPInput, ResendTimer } from "@/components/answerd/OTPInput"
import { useStore } from "@/lib/store"
import { fmtTime, ms } from "@/lib/time"
import { toast } from "@/lib/toast"
import { ensureClaim, maskListed } from "./helpers"

/**
 * B-05 body: 6 OTP boxes and a resend timer. 000000 is wrong, any other 6 digits are right.
 * Five wrong codes lock the number for 15 minutes on the demo clock.
 */
export function CodeEntry({ listingId, method, onVerified, onChangeMethod }: { listingId: string; method: "sms" | "call"; onVerified: (businessId: string) => void; onChangeMethod: () => void }) {
  const s = useStore()
  const l = s.listings.find((x) => x.id === listingId)
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState("")
  const [shake, setShake] = React.useState(0)
  const [busy, setBusy] = React.useState(false)
  if (!l) return null
  const key = l.phonePublic.replace(/\s/g, "")
  const lockedUntil = s.session.lockedUntil[key] && ms(s.session.lockedUntil[key]!) > ms(s.clock) ? s.session.lockedUntil[key]! : null
  const masked = maskListed(l.phonePublic)

  const submit = (v: string) => {
    if (lockedUntil || busy) return
    if (v === "000000") {
      const r = s.recordFailedCode(key)
      setError(r.locked ? "" : `${5 - r.attempts} ${5 - r.attempts === 1 ? "try" : "tries"} left.`)
      setShake((k) => k + 1)
      setCode("")
      return
    }
    setBusy(true)
    const claimId = ensureClaim(listingId, method)
    const res = useStore.getState().verifyClaim(claimId, method, { code: v })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? "That code didn't match.")
      setCode("")
      return
    }
    s.clearFailedCodes(key)
    onVerified(res.businessId!)
  }

  return (
    <div className="flex h-full flex-col">
      <h1 className="t-title">Enter the 6-digit code</h1>
      {method === "sms" ? (
        <p className="mt-1 t-body text-slate">
          We texted it to <span className="font-semibold text-navy tnum">{masked}</span>, the number listed for {l.name}.
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-blue-tint p-3.5">
          <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue text-white">
            <PhoneIncoming className="size-5" aria-hidden />
            <span className="absolute inset-0 animate-ping rounded-full bg-blue/30 motion-reduce:hidden" aria-hidden />
          </span>
          <p className="t-label font-normal text-navy" role="status">
            We&apos;re calling <span className="font-semibold tnum">{masked}</span> now. Answer and we&apos;ll read out your code twice.
          </p>
        </div>
      )}
      {lockedUntil ? (
        <Banner tone="error" className="mt-4" title="Too many wrong codes">
          We&apos;ve paused codes for this number until {fmtTime(lockedUntil)}. Try again later, or verify another way.
        </Banner>
      ) : (
        error && (
          <Banner tone="error" className="mt-4" title="That code didn't match">
            {error}
          </Banner>
        )
      )}
      <div className="mt-6" key={shake}>
        <OTPInput value={code} onChange={setCode} onComplete={submit} error={!!error || !!lockedUntil} disabled={!!lockedUntil || busy} label="Verification code" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        {!lockedUntil && <ResendTimer onResend={() => toast(method === "sms" ? `New code sent to ${masked}` : `Calling ${masked} again`)} />}
        <Button variant="link" size="md" onClick={onChangeMethod} className="ml-auto">
          Try another way
        </Button>
      </div>
      <p className="mt-auto pt-6 t-caption text-muted-ink">Prototype: any 6 digits work. 000000 is always wrong.</p>
    </div>
  )
}
