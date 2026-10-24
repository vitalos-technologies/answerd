"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { CalendarCheck, FileText, Inbox, Mic, PhoneCall, PhoneIncoming, ShieldAlert } from "lucide-react"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { SampleCallPlayer } from "@/components/biz/desk/SampleCallPlayer"
import { CallScreen } from "@/components/biz/desk/CallScreen"
import { useStore } from "@/lib/store"
import { buildScript } from "@/lib/deskScripts"
import { deskFor, listingById, servicesFor } from "@/lib/selectors"
import { toast } from "@/lib/toast"
import type { Listing } from "@/lib/types"
import { SidePanel } from "./kit"
import { dashDeskLinks, deskHref } from "./links"

const LINES = [
  { icon: PhoneIncoming, text: "Answers the calls you miss and texts to your Answerd number, day and night." },
  { icon: CalendarCheck, text: "Quotes only your listed prices and books jobs into free time in your diary." },
  { icon: ShieldAlert, text: "Hands emergencies, complaints and anything tricky straight to you." },
  { icon: Mic, text: "Always says it's an AI assistant, and tells callers the call is recorded." },
]

/** B-30 on the web: what the desk does, a sample call, the price line and Start 14-day free trial (or Upgrade). */
export function DeskIntroPanel({ listing }: { listing: Listing }) {
  const router = useRouter()
  const s = useStore()
  const own = servicesFor(s, listing.businessId).some((x) => x.bookable)
  const sampleListing = own ? listing : listingById(s, "l-swift-plumbing-heating")
  const sample = sampleListing ? buildScript(s, "D-01", sampleListing, 0) : null
  const desk = deskFor(s, listing.businessId)
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="card p-6">
        <h2 className="t-title">Every call answered, even when you&apos;re on a job</h2>
        <ul className="mt-4 space-y-3">
          {LINES.map((l) => (
            <li key={l.text} className="flex items-start gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-tint text-teal-ink">
                <l.icon className="size-5" aria-hidden />
              </span>
              <span className="pt-1.5 t-body text-slate">{l.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-2xl bg-blue-tint p-4">
          <p className="t-label text-navy">£49/month after your free trial. You won&apos;t pay anything before you&apos;ve had 10 enquiries from Answerd.</p>
          <p className="mt-1 t-caption text-muted-ink">£49 ex VAT (£58.80 inc VAT). Cancel any time.</p>
        </div>
        {desk && (
          <div className="mt-5 flex flex-wrap gap-2">
            {desk.trialUsed ? (
              <>
                {desk.status !== "off" && (
                  <ButtonLink href={deskHref("overview")} variant="secondary">
                    Your desk
                  </ButtonLink>
                )}
                <ButtonLink href="/dashboard/billing">Upgrade</ButtonLink>
              </>
            ) : (
              <Button
                onClick={() => {
                  s.startDeskTrial(listing.businessId!)
                  toast("Your 14-day free trial has started")
                  router.push(deskHref("setup"))
                }}
              >
                Start 14-day free trial
              </Button>
            )}
          </div>
        )}
      </div>
      {sample && <SampleCallPlayer lines={sample.steps} callerName={sample.plan.caller.name} title={own ? `Sample call to ${listing.name}` : `Sample call to ${sampleListing!.name}`} />}
    </div>
  )
}

/** W-17 Test call tab: what a test does, and the call itself in a side panel with a streaming transcript (B-33). */
export function TestCallTab({ listing }: { listing: Listing }) {
  const [open, setOpen] = React.useState(false)
  const [round, setRound] = React.useState(0)
  const desk = useStore((s) => deskFor(s, listing.businessId))
  const steps = [
    { icon: PhoneCall, title: "Pick a test", body: "A new caller booking a job, a text after hours, an emergency, a spam call and more (D-01 to D-10)." },
    { icon: FileText, title: "Watch the transcript", body: "Each line streams in as the desk would say it, using your real services, prices, hours and area." },
    { icon: Inbox, title: "See what it did", body: "Threads, bookings, handoffs and the call log land in your inbox and diary as they happen." },
  ]
  return (
    <div className="max-w-3xl">
      <div className="card p-6">
        <h2 className="t-heading">Hear how your desk answers</h2>
        <p className="mt-1 t-body text-slate">Run a test conversation against {listing.name}. Nothing is sent to real customers.</p>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map((x, i) => (
            <li key={x.title} className="rounded-2xl bg-sky p-4">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-white text-blue">
                <x.icon className="size-5" aria-hidden />
              </span>
              <p className="mt-2 t-label text-navy">
                {i + 1}. {x.title}
              </p>
              <p className="mt-0.5 t-caption text-muted-ink">{x.body}</p>
            </li>
          ))}
        </ol>
        {desk?.status === "off" && !desk.trialUsed && <p className="mt-4 t-caption text-muted-ink">Your desk is off. A test call still shows exactly what it would do.</p>}
        <Button className="mt-5" onClick={() => (setRound((r) => r + 1), setOpen(true))}>
          <PhoneCall /> Open test call
        </Button>
      </div>
      <SidePanel open={open} onClose={() => setOpen(false)} title="Test call" width={480}>
        <CallScreen key={round} listing={listing} links={dashDeskLinks} compact onEnd={() => setOpen(false)} />
      </SidePanel>
    </div>
  )
}
