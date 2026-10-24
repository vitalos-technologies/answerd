"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Banner } from "@/components/answerd/Feedback"
import { OTPInput, ResendTimer } from "@/components/answerd/OTPInput"
import { safeNext, withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { fmtTime, ms } from "@/lib/time"
import { toast } from "@/lib/toast"

/** C-07: any 6 digits work except 000000; 5 wrong codes lock the number for 15 minutes on the demo clock. */
function CodePage() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = safeNext(sp.get("next"))
  const phone = sp.get("phone") ?? "07700 900123"
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState("")
  const [shakeKey, setShakeKey] = React.useState(0)
  const s = useStore()
  const lockedUntil = s.session.lockedUntil[phone] && ms(s.session.lockedUntil[phone]!) > ms(s.clock) ? s.session.lockedUntil[phone]! : null
  const attempts = s.session.failedCodes[phone] ?? 0

  const submit = (v: string) => {
    if (lockedUntil) return
    if (v === "000000") {
      const r = s.recordFailedCode(phone)
      setError(r.locked ? "" : `That code didn't match. ${5 - r.attempts} ${5 - r.attempts === 1 ? "try" : "tries"} left.`)
      setShakeKey((k) => k + 1)
      setCode("")
      return
    }
    s.clearFailedCodes(phone)
    const res = s.signInByPhone(phone)
    if (res.existing) router.replace(next)
    else router.replace(`/app/sign-in/about-you?next=${encodeURIComponent(next)}&method=phone`)
  }

  return (
    <AppScreen id="C-07" bg="white" header={<TopBar title="Enter the code" back tone="clear" />}>
      <div className="flex h-full flex-col px-4 pb-6 pt-2">
        <h1 className="t-title">Enter the 6-digit code</h1>
        <p className="mt-1 t-body text-slate">
          Sent to <span className="font-semibold text-navy tnum">{phone}</span>
        </p>
        {lockedUntil ? (
          <Banner tone="error" className="mt-4" title="This number is locked for 15 minutes">
            Five codes didn&apos;t match, so we&apos;ve paused sign-in for {phone} until {fmtTime(lockedUntil)}. Use the hub&apos;s clock to move time on.
          </Banner>
        ) : (
          error && (
            <Banner tone="error" className="mt-4" title="That code didn't match">
              {error.replace("That code didn't match. ", "")}
            </Banner>
          )
        )}
        <div className="mt-6" key={shakeKey}>
          <OTPInput value={code} onChange={setCode} onComplete={submit} error={!!error || !!lockedUntil} disabled={!!lockedUntil} />
        </div>
        <div className="mt-5 flex items-center justify-between">
          {!lockedUntil && <ResendTimer onResend={() => toast(`New code sent to ${phone}`)} />}
          <Link href={`/app/sign-in/phone?next=${encodeURIComponent(next)}&phone=${encodeURIComponent(phone)}`} className="inline-flex h-11 items-center t-label text-blue hover:underline">
            Change number
          </Link>
        </div>
        <p className="mt-auto t-caption text-muted-ink">
          Prototype: any 6 digits sign you in. 000000 is always wrong{attempts ? ` (${attempts} of 5 used)` : ""}.
        </p>
      </div>
    </AppScreen>
  )
}

export default withSuspense(CodePage)
