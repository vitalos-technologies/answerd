"use client"
import { useRouter } from "next/navigation"
import { CalendarCheck, Mic, PhoneIncoming, ShieldAlert } from "lucide-react"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { BizScreen } from "@/components/app/biz"
import { SampleCallPlayer } from "@/components/biz/desk/SampleCallPlayer"
import { useStore } from "@/lib/store"
import { buildScript } from "@/lib/deskScripts"
import { deskFor, listingById, rulesFor, servicesFor } from "@/lib/selectors"
import { gbp } from "@/lib/format"
import { toast } from "@/lib/toast"

const LINES = [
  { icon: PhoneIncoming, text: "Answers the calls you miss and texts to your Answerd number, day and night." },
  { icon: CalendarCheck, text: "Quotes only your listed prices and books jobs into free time in your diary." },
  { icon: ShieldAlert, text: "Hands emergencies, complaints and anything tricky straight to you." },
  { icon: Mic, text: "Always says it's an AI assistant, and tells callers the call is recorded." },
]

/** B-30 AI desk intro */
export default function DeskIntro() {
  const router = useRouter()
  const s = useStore()
  const listing = listingById(s, s.businesses.find((b) => b.id === (s.session.supportViewBusinessId ?? s.session.currentBusinessId))?.listingId)
  // The sample plays this business's own D-01; with no bookable services yet, Swift Plumbing's
  const own = !!listing && servicesFor(s, listing.businessId).some((x) => x.bookable)
  const sampleListing = own ? listing : listingById(s, "l-swift-plumbing-heating")
  const sample = sampleListing ? buildScript(s, "D-01", sampleListing, 0) : null
  const desk = deskFor(s, listing?.businessId)
  const rules = rulesFor(s) // R2: price, trial length and gate from S-06
  const footer =
    listing && desk ? (
      <div className="border-t border-line bg-white px-4 py-3">
        {desk.trialUsed ? (
          <div className="flex gap-2">
            {desk.status !== "off" && (
              <ButtonLink href="/app/biz/desk" variant="secondary" className="flex-1">
                Your desk
              </ButtonLink>
            )}
            <ButtonLink href="/app/biz/billing" className="flex-1">
              Upgrade
            </ButtonLink>
          </div>
        ) : (
          <Button
            block
            onClick={() => {
              s.startDeskTrial(listing.businessId!)
              toast(`Your ${rules.trialDays}-day free trial has started`)
              router.push("/app/biz/desk/setup")
            }}
          >
            Start {rules.trialDays}-day free trial
          </Button>
        )}
      </div>
    ) : null

  return (
    <BizScreen id="B-30" title="AI front desk" back="/app/biz/desk" footer={footer}>
      {() => (
        <div className="space-y-5 px-4 py-5">
          <div>
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
          </div>
          {sample && <SampleCallPlayer lines={sample.steps} callerName={sample.plan.caller.name} title={own ? `Sample call to ${listing!.name}` : `Sample call to ${sampleListing!.name}`} />}
          <div className="rounded-2xl bg-blue-tint p-4">
            <p className="t-label text-navy">{gbp(rules.deskPricePence)}/month after your free trial. You won&apos;t pay anything before you&apos;ve had {rules.gateEnquiries} enquiries from Answerd.</p>
            <p className="mt-1 t-caption text-muted-ink">{gbp(rules.deskPricePence)} ex VAT ({gbp(Math.round(rules.deskPricePence * 1.2))} inc VAT). Cancel any time.</p>
          </div>
        </div>
      )}
    </BizScreen>
  )
}
