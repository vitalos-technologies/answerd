"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Field, TextInput } from "@/components/answerd/Fields"
import { OTPInput } from "@/components/answerd/OTPInput"
import { useStore } from "@/lib/store"
import { dayKey, fmtDateTime, ms } from "@/lib/time"
import { toast } from "@/lib/toast"

/** C-47: type DELETE plus an SMS code; blocked if a booking is today; returns to C-02 as Guest. */
export default function DeleteAccount() {
  const router = useRouter()
  const s = useStore()
  const [typed, setTyped] = React.useState("")
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState("")
  const user = s.users.find((u) => u.id === s.session.userId)
  if (!user) return <AppScreen id="C-47" header={<TopBar title="Delete account" back="/app/account" />}><EmptyState title="You're not signed in" body="There's no account to delete." /></AppScreen>
  const upcoming = s.bookings.filter((b) => b.customerId === user.id && ["requested", "confirmed", "on_the_way", "arrived"].includes(b.status) && ms(b.endAt) > ms(s.clock))
  const today = upcoming.find((b) => dayKey(b.startAt) === dayKey(s.clock))
  const ready = typed === "DELETE" && code.length === 6

  return (
    <AppScreen id="C-47" bg="white" header={<TopBar title="Delete account" back="/app/account/privacy" />}>
      <div className="space-y-5 px-4 py-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-red-tint text-red">
            <AlertTriangle className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="t-title">Delete your account?</h1>
            <p className="mt-1 t-body text-slate">This can&apos;t be undone.</p>
          </div>
        </div>
        <section aria-labelledby="what" className="rounded-2xl bg-sky p-4">
          <h2 id="what" className="t-subhead">
            What we&apos;ll delete
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 t-label font-normal text-slate">
            <li>Your profile, saved businesses and places</li>
            <li>Your messages with businesses</li>
            <li>Reviews you wrote become anonymous</li>
          </ul>
        </section>
        {today ? (
          <Banner tone="error" title="You have a booking today">
            You can delete your account once your {fmtDateTime(today.startAt)} booking is done.
          </Banner>
        ) : (
          upcoming.length > 0 && (
            <Banner tone="warning" title={`${upcoming.length} upcoming booking${upcoming.length > 1 ? "s" : ""} will be cancelled`}>
              We&apos;ll let the businesses know.
            </Banner>
          )
        )}
        <Field label='Type "DELETE" to confirm' htmlFor="typed">
          <TextInput id="typed" value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" disabled={!!today} />
        </Field>
        <div>
          <p className="t-label text-navy">Enter the code we sent to {user.phone || "your phone"}</p>
          <div className="mt-2">
            <OTPInput value={code} onChange={(v) => (setCode(v), setError(""))} autoFocus={false} disabled={!!today} error={!!error} />
          </div>
          {error && (
            <p role="alert" className="mt-2 t-caption text-red">
              {error}
            </p>
          )}
        </div>
        <Button
          block
          variant="destructive"
          disabled={!ready || !!today}
          onClick={() => {
            if (code === "000000") return setError("That code didn't match")
            const r = s.deleteAccount()
            if (!r.ok) return setError(r.reason ?? "Couldn't delete the account")
            toast("Your account has been deleted")
            router.replace("/app/welcome")
          }}
        >
          Delete account
        </Button>
      </div>
    </AppScreen>
  )
}
