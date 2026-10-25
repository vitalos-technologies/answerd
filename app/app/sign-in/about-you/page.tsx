"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { CheckRow, Field, TextInput } from "@/components/answerd/Fields"
import { safeNext, withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { PausedNotice, useSwitch } from "@/components/admin/super/live"

/** C-08: first name required; email optional for receipts; marketing consent unticked. */
function AboutYou() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = safeNext(sp.get("next"))
  const method = (sp.get("method") as "phone" | "apple" | "google") ?? "phone"
  const createAccount = useStore((s) => s.createAccount)
  const [first, setFirst] = React.useState(sp.get("first") ?? "")
  const [last, setLast] = React.useState(sp.get("last") ?? "")
  const [email, setEmail] = React.useState("")
  const [marketing, setMarketing] = React.useState(false)
  const [errors, setErrors] = React.useState<{ first?: string; email?: string }>({})
  // R2 (S-07): new accounts can be paused platform-wide
  const signups = useSwitch("signups")

  if (!signups) {
    return (
      <AppScreen id="C-08" bg="white" header={<TopBar title="About you" back tone="clear" />}>
        <PausedNotice title="We're not taking new sign-ups right now" body="New accounts are paused for a short while. You can still search, browse and call businesses without an account." action={{ href: "/app", label: "Keep browsing" }} />
      </AppScreen>
    )
  }

  return (
    <AppScreen id="C-08" bg="white" header={<TopBar title="About you" back tone="clear" />}>
      <form
        className="flex min-h-full flex-col px-4 pb-6 pt-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          const errs: typeof errors = {}
          if (!first.trim()) errs.first = "Enter your first name"
          if (email && !/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter an email like name@example.com"
          setErrors(errs)
          if (Object.keys(errs).length) return
          createAccount({ firstName: first.trim(), lastName: last.trim(), email: email.trim(), marketing, method })
          toast(`Welcome to Answerd, ${first.trim()}`)
          router.replace(next)
        }}
      >
        <h1 className="t-title">Nice to meet you</h1>
        <p className="mt-1 t-body text-slate">Businesses see your first name and last initial.</p>
        <div className="mt-6 space-y-4">
          <Field label="First name" htmlFor="first" error={errors.first}>
            <TextInput id="first" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" aria-invalid={!!errors.first} autoFocus />
          </Field>
          <Field label="Last name" htmlFor="last" optional>
            <TextInput id="last" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
          </Field>
          <Field label="Email" htmlFor="email" optional hint="For booking receipts only" error={errors.email}>
            <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
          </Field>
          <CheckRow label="Send me offers and news from Answerd" description="You can change this any time in Privacy and data." checked={marketing} onChange={setMarketing} />
        </div>
        <div className="mt-auto pt-6">
          <Button block type="submit">
            Continue
          </Button>
        </div>
      </form>
    </AppScreen>
  )
}

export default withSuspense(AboutYou)
