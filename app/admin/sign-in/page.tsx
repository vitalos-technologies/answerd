"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { OTPInput } from "@/components/answerd/OTPInput"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { withSuspense } from "@/components/app/helpers"
import { GoogleMark } from "@/components/admin/GoogleMark"
import { adminInput } from "@/components/admin/kit"
import { useStore } from "@/lib/store"
import { PERSONAS } from "@/lib/seed"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

const DOMAIN = "vitalos.co.uk"

/** A-01: mock Google Workspace sign-in restricted to vitalos.co.uk, then an authenticator code. */
function AdminSignIn() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")?.startsWith("/admin") ? params.get("next")! : "/admin"
  const users = useStore((s) => s.users)
  const [step, setStep] = React.useState<"start" | "choose" | "code">("start")
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [code, setCode] = React.useState("")
  const [codeError, setCodeError] = React.useState<string | null>(null)
  const [chosen, setChosen] = React.useState<string | null>(null)

  const accounts = [
    ...users.filter((u) => u.staffRole && u.email && ["u-temitope", "u-ife", "u-dan"].includes(u.id)),
    ...users.filter((u) => ["u-tayo", "u-sam"].includes(u.id)),
  ]

  const choose = (addr: string) => {
    const a = addr.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a)) return setError("Enter a full email address.")
    // R2: refused attempts are recorded for the S-10 security log
    const refuse = (msg: string, detail: string) => {
      useStore.getState().recordSignInAttempt({ userId: users.find((x) => x.email?.toLowerCase() === a)?.id ?? null, email: a, method: "Google + authenticator", ok: false, detail })
      setError(msg)
    }
    if (!a.endsWith(`@${DOMAIN}`)) return refuse(`Only ${DOMAIN} Google Workspace accounts can sign in to Answerd admin. Switch to your Vitalos account.`, `Not a ${DOMAIN} account`)
    const u = users.find((x) => x.email?.toLowerCase() === a && x.staffRole)
    const persona = PERSONAS.find((p) => p.userId === u?.id)
    if (!u || !persona) return refuse("This Vitalos account isn't an Answerd admin or support user yet. Ask an admin to invite you.", "Not an admin user")
    setError(null)
    setChosen(persona.id)
    setStep("code")
  }

  const verify = (v: string) => {
    if (v.length < 6) return setCodeError("Enter all 6 digits.")
    if (v === "000000") {
      setCode("")
      const u = users.find((x) => x.id === who?.userId)
      useStore.getState().recordSignInAttempt({ userId: u?.id ?? null, email: u?.email ?? "", method: "Google + authenticator", ok: false, detail: "Wrong authenticator code" })
      return setCodeError("That code didn't match. Check your authenticator app and try again.")
    }
    finish("Google + authenticator")
  }

  const finish = (method: "Google + authenticator" | "Google + security key") => {
    const st = useStore.getState()
    st.signIn(chosen as "ife" | "dan" | "temitope", "google")
    st.adminSignIn(method)
    router.replace(next)
  }

  const [keyBusy, setKeyBusy] = React.useState(false)
  const signWithKey = () => {
    setKeyBusy(true)
    setTimeout(() => finish("Google + security key"), 600)
  }

  const who = PERSONAS.find((p) => p.id === chosen)
  const whoUser = users.find((x) => x.id === who?.userId)
  const roleName = whoUser?.staffRole === "super_admin" ? "Super admin" : whoUser?.staffRole === "admin" ? "Admin" : "Support"
  return (
    <div className="flex min-h-dvh items-center justify-center bg-sky px-6 py-12">
      <ScreenMeta id="A-01" />
      <div className="w-full max-w-[440px] rounded-2xl border border-line bg-white p-8 shadow-card">
        <Logo layout="horizontal" size={30} />
        {step === "start" && (
          <>
            <h1 className="mt-8 text-[24px] font-bold leading-[30px] text-navy">Answerd admin</h1>
            <p className="mt-2 t-body text-slate">For Vitalos staff. Sign in with your {DOMAIN} Google account, then confirm with your authenticator app.</p>
            <Button variant="secondary" block className="mt-8" onClick={() => setStep("choose")}>
              <GoogleMark /> Sign in with Google
            </Button>
            <p className="mt-4 t-caption text-muted-ink">Admin sessions last 12 hours; super admin sessions last 8 hours. Every write is recorded in the audit log.</p>
          </>
        )}
        {step === "choose" && (
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <GoogleMark />
              <p className="t-label text-slate">Sign in with Google</p>
            </div>
            <h1 className="mt-3 text-[22px] font-semibold text-navy">Choose an account</h1>
            <p className="t-label font-normal text-slate">to continue to Answerd admin</p>
            {error && (
              <Banner tone="error" title="Wrong domain" className="mt-4">
                {error}
              </Banner>
            )}
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
              {accounts.map((u) => (
                <li key={u.id}>
                  <button type="button" onClick={() => choose(u.email ?? "")} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left hover:bg-sky">
                    <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white", u.staffRole ? "bg-blue" : "bg-slate")}>{initials(`${u.firstName} ${u.lastName}`)}</span>
                    <span className="min-w-0">
                      <span className="block t-label text-navy">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="block truncate t-caption text-muted-ink">{u.email}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="mt-4 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                choose(email)
              }}
            >
              <label htmlFor="other-email" className="t-label text-navy">
                Use another account
              </label>
              <input id="other-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`name@${DOMAIN}`} className={adminInput} aria-invalid={!!error || undefined} />
              <Button type="submit" variant="primary" size="md">
                Next
              </Button>
            </form>
            <Button variant="ghost" size="md" className="mt-2" onClick={() => setStep("start")}>
              <ArrowLeft aria-hidden /> Back
            </Button>
          </div>
        )}
        {step === "code" && (
          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault()
              verify(code)
            }}
          >
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-blue-tint text-blue">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
            <h1 className="mt-4 text-[22px] font-semibold text-navy">Enter your authenticator code</h1>
            <p className="mt-1 t-body text-slate">
              Signed in as {who?.name} ({roleName}). Open your authenticator app and enter the 6-digit code for Answerd admin.
            </p>
            <div className="mt-6">
              <OTPInput
                value={code}
                onChange={(v) => {
                  setCode(v)
                  setCodeError(null)
                }}
                onComplete={verify}
                error={!!codeError}
                label="Authenticator code"
              />
            </div>
            {codeError && (
              <p role="alert" className="mt-2 t-caption text-red">
                {codeError}
              </p>
            )}
            <Button type="submit" block className="mt-6">
              Verify
            </Button>
            {whoUser?.twoFactor?.includes("security_key") && (
              <Button variant="secondary" block className="mt-2" loading={keyBusy} onClick={signWithKey}>
                <KeyRound aria-hidden /> Use your security key
              </Button>
            )}
            <Button
              variant="ghost"
              size="md"
              className="mt-2"
              onClick={() => {
                setStep("choose")
                setCode("")
                setCodeError(null)
              }}
            >
              <ArrowLeft aria-hidden /> Use a different account
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default withSuspense(AdminSignIn)
