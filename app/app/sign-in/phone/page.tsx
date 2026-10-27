"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { inputCls } from "@/components/answerd/Fields"
import { safeNext, withSuspense } from "@/components/app/helpers"
import { normaliseUkMobile } from "@/lib/format"
import { useStore } from "@/lib/store"
import { fmtTime, ms } from "@/lib/time"
import { cn } from "@/lib/utils"
import { SignupsPausedBanner } from "@/components/admin/super/live"
import { apiMode } from "@/lib/api/config"
import { otpStart } from "@/lib/api/client"

/** C-06: UK mobile in any common format. */
function PhonePage() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = safeNext(sp.get("next"))
  const [value, setValue] = React.useState(sp.get("phone") ?? "")
  const [err, setErr] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const locked = useStore((s) => s.session.lockedUntil)
  const clock = useStore((s) => s.clock)
  const normal = normaliseUkMobile(value)
  const lockedUntil = normal && locked[normal] && ms(locked[normal]!) > ms(clock) ? locked[normal] : null

  return (
    <AppScreen id="C-06" bg="white" header={<TopBar title="Your mobile number" back tone="clear" />}>
      <form
        className="flex h-full flex-col px-4 pb-6 pt-2"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!normal) return setErr("Enter a UK mobile number, like 07700 900123")
          if (lockedUntil) return
          setLoading(true)
          const to = `/app/sign-in/code?next=${encodeURIComponent(next)}&phone=${encodeURIComponent(normal)}`
          if (!apiMode) return void setTimeout(() => router.push(to), 500)
          // API mode: the real phone-code flow (staging texts allowlisted test numbers only)
          try {
            await otpStart(normal)
            router.push(to)
          } catch (x) {
            setLoading(false)
            setErr(x instanceof Error ? x.message : "We couldn't send a code. Try again.")
          }
        }}
      >
        <h1 className="t-title">What&apos;s your mobile number?</h1>
        <p className="mt-1 t-body text-slate">We&apos;ll text you a 6-digit code. Standard rates may apply.</p>
        <SignupsPausedBanner className="mt-4" />
        {lockedUntil && (
          <Banner tone="warning" className="mt-4" title="Too many attempts">
            For your security this number is locked until {fmtTime(lockedUntil)}. Try again then, or use another number.
          </Banner>
        )}
        <label htmlFor="phone" className="mt-6 t-label text-navy">
          Mobile number
        </label>
        <div className="mt-1.5 flex gap-2">
          <span className={cn(inputCls, "flex w-20 items-center justify-center bg-sky text-navy")} aria-label="Country code +44">
            🇬🇧 +44
          </span>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setErr("")
            }}
            placeholder="07700 900123"
            aria-invalid={!!err}
            aria-describedby={err ? "phone-err" : undefined}
            className={cn(inputCls, "flex-1 tnum")}
          />
        </div>
        {err && (
          <p id="phone-err" className="mt-1.5 t-caption text-red" role="alert">
            {err}
          </p>
        )}
        <p className="mt-2 t-caption text-muted-ink">
          {apiMode ? "API mode: we text a real code. On staging, only allowlisted test numbers get one." : "Prototype: any UK mobile works. Tayo is 07700 900123, Sam 07700 900456, Jo 07700 900457."}
        </p>
        <div className="mt-auto">
          <Button block type="submit" loading={loading} disabled={!value}>
            Send code
          </Button>
        </div>
      </form>
    </AppScreen>
  )
}

export default withSuspense(PhonePage)
