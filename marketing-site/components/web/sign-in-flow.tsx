"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, MailCheck, Smartphone } from "lucide-react"
import { Mark } from "@/components/brand/Mark"
import { cn } from "@/lib/utils"
import { fill } from "@/lib/fill"
import { focusRing } from "@/components/site/focus"
import { safeNext, useDemo, writeDemo } from "@/lib/demo-session"
import { apiEnabled } from "@/lib/api/client"
import { signInStart, signInVerify, signOut } from "@/lib/api/actions"
import type { pages } from "@/content/pages"
import { CodeInput, Field, Note, btnPrimary, btnSecondary, inputCls, linkCls } from "./form"

type Copy = (typeof pages)["signIn"]
type Step = "start" | "code" | "inbox" | "google"

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

function normaliseUkMobile(input: string) {
  let d = input.replace(/[^\d+]/g, "")
  if (d.startsWith("+44")) d = "0" + d.slice(3)
  else if (d.startsWith("0044")) d = "0" + d.slice(4)
  else if (d.startsWith("7") && d.length === 10) d = "0" + d
  return /^07\d{9}$/.test(d) ? `${d.slice(0, 5)} ${d.slice(5)}` : null
}

const noop = () => () => {}

/**
 * W-12 mock sign-in for business owners who need billing: phone and SMS code, Continue with Google, or an
 * email link. Every route signs you in as the demo owner (sessionStorage only) and returns you to ?next=.
 */
export function SignInFlow({ copy }: { copy: Copy }) {
  const router = useRouter()
  const demo = useDemo()
  const next = React.useSyncExternalStore(noop, () => safeNext(new URLSearchParams(window.location.search).get("next"), "/billing"), () => "/billing")
  const [step, setStep] = React.useState<Step>("start")
  const [phone, setPhone] = React.useState("")
  const [phoneErr, setPhoneErr] = React.useState("")
  const [code, setCode] = React.useState("")
  const [codeErr, setCodeErr] = React.useState("")
  const [tries, setTries] = React.useState(5)
  const [emailOpen, setEmailOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [emailErr, setEmailErr] = React.useState("")
  const card = React.useRef<HTMLDivElement>(null)
  const [busy, setBusy] = React.useState(false)

  const goStep = (s: Step) => {
    setStep(s)
    requestAnimationFrame(() => card.current?.querySelector<HTMLElement>("h1")?.focus())
  }
  const signIn = () => {
    writeDemo((s) => ({ ...s, user: copy.demo }))
    router.push(next)
  }

  if (demo?.user && step === "start") {
    return (
      <Shell cardRef={card}>
        <Title>{copy.signedIn}</Title>
        <p className="mt-2 text-slate">{demo.user.business ? fill(copy.signedInAs, { name: demo.user.name, business: demo.user.business }) : fill(copy.signedInAsNoBusiness, { name: demo.user.name })}</p>
        <div className="mt-6 grid gap-2">
          <Link href={demo.user.business ? next : "/claim"} className={btnPrimary}>
            {demo.user.business ? copy.continue : copy.claimLink}
          </Link>
          <button
            type="button"
            className={btnSecondary}
            onClick={async () => {
              if (demo.user?.api) await signOut()
              writeDemo((s) => ({ ...s, user: null, subs: [] }))
            }}
          >
            {copy.signOut}
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell cardRef={card}>
      {step !== "start" && (
        <button type="button" onClick={() => goStep("start")} className={`-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-semibold text-blue hover:bg-blue-tint ${focusRing}`}>
          <ArrowLeft className="size-4" aria-hidden /> {copy.otherWays}
        </button>
      )}

      {step === "start" && (
        <>
          <div className="flex flex-col items-center text-center">
            <Mark size={52} />
            <Title className="mt-3">{copy.heading}</Title>
            <p className="mt-1.5 text-slate">{copy.body}</p>
          </div>
          <form
            className="mt-6 flex flex-col gap-3"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault()
              const n = normaliseUkMobile(phone)
              if (!n) return setPhoneErr(copy.phoneError)
              if (apiEnabled) {
                setBusy(true)
                const r = await signInStart(n)
                setBusy(false)
                if (!r.ok) return setPhoneErr(r.status ? r.message : copy.unreachable)
              }
              setPhoneErr("")
              setPhone(n)
              setCode("")
              setCodeErr("")
              goStep("code")
            }}
          >
            <Field label={copy.phone} htmlFor="si-phone" error={phoneErr} hint={copy.phoneHint}>
              <input id="si-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900123" aria-invalid={!!phoneErr || undefined} aria-describedby="si-phone-msg" className={cn(inputCls, "tnum")} />
            </Field>
            <button type="submit" className={btnPrimary} disabled={busy}>
              <Smartphone aria-hidden /> {busy ? copy.sending : copy.sendCode}
            </button>
          </form>
          {/* Google and email sign-in are prototype-only: the API signs in by phone code */}
          {!apiEnabled && (
            <>
              <div className="my-5 flex items-center gap-3 text-[14px] text-muted-ink">
                <span className="h-px flex-1 bg-line" /> {copy.or} <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid gap-2">
                <button type="button" className={btnSecondary} onClick={() => goStep("google")}>
                  <GoogleG /> {copy.google}
                </button>
                {emailOpen ? (
                  <form
                    noValidate
                    className="flex flex-col gap-3 rounded-2xl border border-line p-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setEmailErr(copy.emailError)
                      setEmailErr("")
                      goStep("inbox")
                    }}
                  >
                    <Field label={copy.emailLabel} htmlFor="si-email" error={emailErr}>
                      <input id="si-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={!!emailErr || undefined} className={inputCls} />
                    </Field>
                    <button type="submit" className={btnPrimary}>
                      {copy.emailSend}
                    </button>
                  </form>
                ) : (
                  <button type="button" className={btnSecondary} onClick={() => setEmailOpen(true)}>
                    <Mail aria-hidden /> {copy.email}
                  </button>
                )}
              </div>
            </>
          )}
          <p className="mt-6 text-center text-[14px] leading-5 text-muted-ink">
            {copy.terms.split(/(\{terms\}|\{privacy\})/).map((part, i) =>
              part === "{terms}" ? (
                <Link key={i} href="/terms" className={linkCls}>
                  {copy.termsLink}
                </Link>
              ) : part === "{privacy}" ? (
                <Link key={i} href="/privacy" className={linkCls}>
                  {copy.privacyLink}
                </Link>
              ) : (
                part
              ),
            )}
          </p>
        </>
      )}

      {step === "code" && (
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault()
            if (code.length !== 6) return setCodeErr(copy.codeShort)
            if (apiEnabled) {
              setBusy(true)
              const r = await signInVerify(phone, code)
              setBusy(false)
              if (!r.ok) {
                setCode("")
                return setCodeErr(r.status ? r.message : copy.unreachable)
              }
              writeDemo((s) => ({ ...s, user: { ...r.data, api: true } }))
              // No business yet: claiming is the next step (keep a ?listing= from the claim flow)
              return router.push(r.data.business || next.startsWith("/claim") ? next : "/claim")
            }
            if (code === "000000") {
              const left = Math.max(0, tries - 1)
              setTries(left)
              setCode("")
              return setCodeErr(fill(copy.codeWrong, { left }))
            }
            signIn()
          }}
        >
          <Title>{copy.codeHeading}</Title>
          <p className="mt-1.5 text-slate">{fill(copy.codeSent, { phone })}</p>
          <Field label={copy.codeLabel} htmlFor="si-code" error={codeErr} hint={apiEnabled ? undefined : copy.hintCode} className="mt-6">
            <CodeInput id="si-code" value={code} onChange={setCode} invalid={!!codeErr} describedBy="si-code-msg" />
          </Field>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" className={btnPrimary} disabled={busy}>
              {busy ? copy.checking : copy.codeSubmit}
            </button>
            <button type="button" onClick={() => goStep("start")} className={`inline-flex h-11 items-center rounded-full px-3 font-semibold text-blue hover:bg-blue-tint ${focusRing}`}>
              {copy.changeNumber}
            </button>
          </div>
        </form>
      )}

      {step === "inbox" && (
        <div className="text-center">
          <span aria-hidden className="mx-auto grid size-16 place-items-center rounded-full bg-blue-tint text-blue">
            <MailCheck className="size-8" />
          </span>
          <Title className="mt-4">{copy.inboxHeading}</Title>
          <p className="mt-2 text-slate">{fill(copy.inboxBody, { email })}</p>
          <Note className="mt-6 border border-dashed border-line !bg-sky">
            <p>{copy.hintEmail}</p>
            <button type="button" className={cn(btnPrimary, "mt-3")} onClick={signIn}>
              {copy.inboxOpen}
            </button>
          </Note>
        </div>
      )}

      {step === "google" && (
        <div className="text-center">
          <span aria-hidden className="mx-auto grid size-16 place-items-center rounded-full bg-sky">
            <GoogleG />
          </span>
          <Title className="mt-4">{copy.googleHeading}</Title>
          <p className="mt-2 text-slate">{copy.googleBody}</p>
          <button type="button" className={cn(btnPrimary, "mt-6")} onClick={signIn}>
            {copy.googleContinue}
          </button>
        </div>
      )}
    </Shell>
  )
}

function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 tabIndex={-1} className={cn("text-[26px] leading-8 font-bold tracking-[-0.01em] text-navy outline-none md:text-[30px] md:leading-9", className)}>
      {children}
    </h1>
  )
}

function Shell({ children, cardRef }: { children: React.ReactNode; cardRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="container-site py-10 md:py-16">
      <div ref={cardRef} className="card-site mx-auto w-full max-w-md p-6 md:p-8">
        {children}
      </div>
    </div>
  )
}
