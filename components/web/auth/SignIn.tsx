"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Mail, MailCheck, Smartphone } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Field, TextInput, CheckRow } from "@/components/answerd/Fields"
import { OTPInput, ResendTimer } from "@/components/answerd/OTPInput"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Mark } from "@/components/brand/Mark"
import { useStore } from "@/lib/store"
import { PERSONAS } from "@/lib/seed"
import { membershipsFor } from "@/lib/selectors"
import { normaliseUkMobile } from "@/lib/format"
import { fmtTime, ms } from "@/lib/time"
import { toast } from "@/lib/toast"

type Step = "start" | "code" | "about" | "inbox"
type Method = "phone" | "google" | "email"

export function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null
}

/** W-12: phone and SMS code, Continue with Google (mock), Email me a sign-in link. Businesses land on /dashboard, customers on /account. */
function SignInInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = safeNext(sp.get("next"))
  const reason = sp.get("reason")
  const s = useStore()
  const [step, setStep] = React.useState<Step>("start")
  const [method, setMethod] = React.useState<Method>("phone")
  const [phone, setPhone] = React.useState("")
  const [phoneErr, setPhoneErr] = React.useState("")
  const [code, setCode] = React.useState("")
  const [codeErr, setCodeErr] = React.useState("")
  const [shake, setShake] = React.useState(0)
  const [email, setEmail] = React.useState("")
  const [emailErr, setEmailErr] = React.useState("")
  const [emailOpen, setEmailOpen] = React.useState(false)
  const [googleOpen, setGoogleOpen] = React.useState(false)
  const [first, setFirst] = React.useState("")
  const [last, setLast] = React.useState("")
  const [aboutEmail, setAboutEmail] = React.useState("")
  const [marketing, setMarketing] = React.useState(false)
  const [firstErr, setFirstErr] = React.useState("")

  const land = () => {
    const st = useStore.getState()
    const mems = membershipsFor(st, st.session.userId)
    if (next) return router.replace(next)
    if (mems.length) {
      st.setMode("business", mems[0]!.businessId)
      router.replace("/dashboard")
    } else router.replace("/account")
  }

  const locked = phone && s.session.lockedUntil[phone] && ms(s.session.lockedUntil[phone]!) > ms(s.clock) ? s.session.lockedUntil[phone]! : null

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault()
    const n = normaliseUkMobile(phone)
    if (!n) return setPhoneErr("Enter a UK mobile number, like 07700 900123")
    setPhoneErr("")
    setPhone(n)
    setMethod("phone")
    setCode("")
    setCodeErr("")
    setStep("code")
    toast(`Code sent to ${n}`)
  }
  const checkCode = (v: string) => {
    if (locked) return
    if (v === "000000") {
      const r = s.recordFailedCode(phone)
      setCodeErr(r.locked ? "" : `That code didn't match. ${5 - r.attempts} ${5 - r.attempts === 1 ? "try" : "tries"} left.`)
      setShake((k) => k + 1)
      setCode("")
      return
    }
    s.clearFailedCodes(phone)
    const res = s.signInByPhone(phone)
    if (res.existing) land()
    else setStep("about")
  }
  const sendLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setEmailErr("Enter an email address, like you@example.com")
    setEmailErr("")
    setEmailOpen(false)
    setMethod("email")
    setStep("inbox")
  }
  const openLink = () => {
    const st = useStore.getState()
    const u = st.users.find((x) => x.email?.toLowerCase() === email.trim().toLowerCase() && !x.deleted)
    if (u) {
      const persona = PERSONAS.find((p) => p.userId === u.id)
      if (persona) st.signIn(persona.id, "email")
      else st.signInByPhone(u.phone)
      land()
    } else {
      setAboutEmail(email.trim())
      setStep("about")
    }
  }
  const google = (persona: "sam" | "tayo" | null) => {
    setGoogleOpen(false)
    if (persona) {
      s.signIn(persona, "google")
      land()
      return
    }
    setMethod("google")
    setStep("about")
  }
  const createAccount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!first.trim()) return setFirstErr("Enter your first name")
    s.createAccount({ phone: method === "phone" ? phone : undefined, firstName: first.trim(), lastName: last.trim(), email: aboutEmail.trim() || undefined, marketing, method })
    toast(`Welcome to Answerd, ${first.trim()}`)
    land()
  }

  if (s.hydrated && s.session.userId && step === "start") {
    const u = s.users.find((x) => x.id === s.session.userId)
    // Sent here by the business dashboard (W-13 to W-19) while signed in as a customer only
    if (reason === "business" && !membershipsFor(s, s.session.userId).length)
      return (
        <Card>
          <h1 className="t-title">No business on this account</h1>
          <p className="mt-2 t-body text-slate">{u ? `${u.firstName} ${u.lastName} is` : "You're"} signed in as a customer. The dashboard is for business owners and their team.</p>
          <div className="mt-6 grid gap-2">
            <Button onClick={() => s.signOut()}>Sign in with a business account</Button>
            <ButtonLink href="/claim" variant="secondary">
              List or claim your business
            </ButtonLink>
            <ButtonLink href="/account" variant="ghost">
              Go to your account
            </ButtonLink>
          </div>
        </Card>
      )
    return (
      <Card>
        <h1 className="t-title">You&apos;re signed in</h1>
        <p className="mt-2 t-body text-slate">Signed in as {u ? `${u.firstName} ${u.lastName}` : "you"}.</p>
        <div className="mt-6 grid gap-2">
          <Button onClick={land}>Continue</Button>
          <Button variant="secondary" onClick={() => s.signOut()}>
            Sign in as someone else
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      {step !== "start" && (
        <button type="button" onClick={() => setStep("start")} className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 t-label text-blue hover:bg-blue-tint">
          <ArrowLeft className="size-4" aria-hidden /> Other ways to sign in
        </button>
      )}

      {step === "start" && (
        <>
          <div className="flex flex-col items-center text-center">
            <Mark size={52} />
            <h1 className="t-title mt-3">Sign in to Answerd</h1>
            <p className="mt-1 t-body text-slate">One account for booking local services and running your business.</p>
          </div>
          {reason === "ask" && (
            <Banner tone="info" className="mt-4" title="Sign in to keep chatting">
              Guests get 5 messages with Answerd. Sign in and pick up where you left off.
            </Banner>
          )}
          {next && reason !== "ask" && (
            <Banner tone="info" className="mt-4" title="Sign in to carry on">
              We&apos;ll take you straight back afterwards.
            </Banner>
          )}
          <form className="mt-6 space-y-3" onSubmit={sendCode} noValidate>
            <Field label="Mobile number" htmlFor="si-phone" error={phoneErr} hint="We'll text you a 6-digit code">
              <div className="flex gap-2">
                <span className="inline-flex h-12 shrink-0 items-center rounded-[12px] border border-line bg-sky px-3 t-body text-navy" aria-hidden>
                  +44
                </span>
                <TextInput id="si-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900123" aria-invalid={!!phoneErr} className="tnum" />
              </div>
            </Field>
            <Button type="submit" block>
              <Smartphone /> Send code
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 t-caption text-muted-ink">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid gap-2">
            <Button variant="secondary" block onClick={() => setGoogleOpen(true)}>
              <GoogleG /> Continue with Google
            </Button>
            {emailOpen ? (
              <form onSubmit={sendLink} className="space-y-2 rounded-2xl border border-line p-3" noValidate>
                <Field label="Email" htmlFor="si-email" error={emailErr}>
                  <TextInput id="si-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={!!emailErr} autoFocus />
                </Field>
                <Button type="submit" block size="md">
                  Email me a sign-in link
                </Button>
              </form>
            ) : (
              <Button variant="secondary" block onClick={() => setEmailOpen(true)}>
                <Mail /> Email me a sign-in link
              </Button>
            )}
          </div>
          <p className="mt-6 text-center t-caption text-muted-ink">
            By continuing you agree to our{" "}
            <Link href="/legal/terms" className="text-blue underline underline-offset-2">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-blue underline underline-offset-2">
              privacy notice
            </Link>
            .
          </p>
        </>
      )}

      {step === "code" && (
        <>
          <h1 className="t-title">Enter the 6-digit code</h1>
          <p className="mt-1 t-body text-slate">
            Sent to <span className="font-semibold text-navy tnum">{phone}</span>
          </p>
          {locked ? (
            <Banner tone="error" className="mt-4" title="This number is locked for 15 minutes">
              Five codes didn&apos;t match, so we&apos;ve paused sign-in for {phone} until {fmtTime(locked)}.
            </Banner>
          ) : (
            codeErr && (
              <Banner tone="error" className="mt-4" title="That code didn't match">
                {codeErr.replace("That code didn't match. ", "")}
              </Banner>
            )
          )}
          <div className="mt-6" key={shake}>
            <OTPInput value={code} onChange={setCode} onComplete={checkCode} error={!!codeErr || !!locked} disabled={!!locked} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            {!locked && <ResendTimer onResend={() => toast(`New code sent to ${phone}`)} />}
            <button type="button" onClick={() => setStep("start")} className="inline-flex h-11 items-center t-label text-blue hover:underline">
              Change number
            </button>
          </div>
          <p className="mt-6 t-caption text-muted-ink">Prototype: any 6 digits sign you in. 000000 is always wrong.</p>
        </>
      )}

      {step === "inbox" && (
        <div className="text-center">
          <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-blue-tint text-blue">
            <MailCheck className="size-8" aria-hidden />
          </span>
          <h1 className="t-title mt-4">Check your inbox</h1>
          <p className="mt-2 t-body text-slate">
            We sent a sign-in link to <span className="font-semibold text-navy">{email}</span>. It works for 15 minutes.
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-sky p-4">
            <p className="t-caption text-muted-ink">Prototype: no email is sent.</p>
            <Button className="mt-2" onClick={openLink}>
              Open the link
            </Button>
          </div>
          <button type="button" onClick={() => toast(`Link sent again to ${email}`)} className="mt-4 inline-flex min-h-11 items-center t-label text-blue hover:underline">
            Send it again
          </button>
        </div>
      )}

      {step === "about" && (
        <form onSubmit={createAccount} noValidate>
          <h1 className="t-title">About you</h1>
          <p className="mt-1 t-body text-slate">New to Answerd. This is how businesses will see you.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="First name" htmlFor="ab-first" error={firstErr}>
              <TextInput id="ab-first" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" aria-invalid={!!firstErr} autoFocus />
            </Field>
            <Field label="Last name" htmlFor="ab-last" optional>
              <TextInput id="ab-last" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Email" htmlFor="ab-email" optional hint="For receipts" className="mt-3">
            <TextInput id="ab-email" type="email" value={aboutEmail} onChange={(e) => setAboutEmail(e.target.value)} autoComplete="email" />
          </Field>
          <div className="mt-3">
            <CheckRow label="Send me occasional offers and news from Answerd" checked={marketing} onChange={setMarketing} />
          </div>
          <Button type="submit" block className="mt-5">
            Continue
          </Button>
        </form>
      )}

      <Dialog open={googleOpen} onOpenChange={setGoogleOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-0 bg-white p-6 shadow-overlay sm:max-w-sm">
          <div className="flex items-center gap-2">
            <GoogleG />
            <DialogTitle className="t-subhead">Choose an account</DialogTitle>
          </div>
          <DialogDescription className="t-caption text-muted-ink">to continue to Answerd (prototype Google sign-in)</DialogDescription>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {(
              [
                ["sam", "Sam Okafor", "sam@swiftplumbing.example"],
                ["tayo", "Tayo Adeyemi", "tayo@example.com"],
              ] as const
            ).map(([p, name, mail]) => (
              <li key={p}>
                <button type="button" onClick={() => google(p)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left hover:bg-sky">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-blue-tint t-label text-blue">{name[0]}</span>
                  <span className="min-w-0">
                    <span className="block t-label text-navy">{name}</span>
                    <span className="block truncate t-caption text-muted-ink">{mail}</span>
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => google(null)} className="flex min-h-14 w-full items-center px-4 t-label text-blue hover:bg-sky">
                Use another account
              </button>
            </li>
          </ul>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-10 max-sm:px-4 md:py-16">
      <ScreenMeta id="W-12" />
      <div className="card mx-auto w-full max-w-md p-6 md:p-8">{children}</div>
    </div>
  )
}

export function SignIn() {
  return (
    <React.Suspense fallback={null}>
      <SignInInner />
    </React.Suspense>
  )
}
