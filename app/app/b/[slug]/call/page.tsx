"use client"
import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Mic, PhoneOff, PhoneOutgoing, User, Volume2, X } from "lucide-react"
import { DeskIcon } from "@/components/brand/DeskIcon"
import { AppScreen } from "@/components/shells/AppScreen"
import { RouteSheet } from "@/components/app/RouteSheet"
import { Button } from "@/components/answerd/Button"
import { ListingAvatar } from "@/components/answerd/Media"
import { ListingNotFound } from "@/components/app/listing"
import { useStore } from "@/lib/store"
import { isDeskLive, listingBySlug } from "@/lib/selectors"
import { fmtDuration } from "@/lib/time"

/** C-20: call via an Answerd number, then an in-frame calling screen with demo outcomes. */
export default function CallSheet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const s = useStore()
  const listing = listingBySlug(s, slug)
  const [calling, setCalling] = React.useState(false)
  const [sec, setSec] = React.useState(0)
  React.useEffect(() => {
    if (!calling) return
    const t = setInterval(() => setSec((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [calling])
  if (!listing) return <AppScreen id="C-20"><ListingNotFound /></AppScreen>
  const desk = isDeskLive(s, listing)
  const tracked = s.deskConfigs.find((c) => c.businessId === listing.businessId)?.number || "020 7946 0800"
  const close = () => router.replace(`/app/b/${slug}`)

  const finish = (outcome: "owner" | "desk" | "missed") => {
    let callId: string
    if (outcome === "desk") {
      const u = s.users.find((x) => x.id === s.session.userId)
      const runId = s.runDeskScript("D-01", listing.id, {
        noBook: true,
        stepMs: 900,
        caller: { name: u ? `${u.firstName} ${u.lastName[0] ?? ""}.` : "Guest caller", phone: u?.phone || "07700 900000", customerId: s.session.userId, postcode: s.session.location?.postcode },
      })
      callId = useStore.getState().runs.find((r) => r.id === runId)?.callId ?? ""
    } else {
      callId = s.logCall(listing.id, outcome, outcome === "missed" ? 0 : Math.max(sec, 75))
    }
    router.replace(`/app/b/${slug}/after-call?call=${callId}&outcome=${outcome}`)
  }

  if (calling) {
    return (
      <AppScreen id="C-20" bg="white" className="bg-navy">
        <div className="flex h-full flex-col items-center bg-navy px-6 pb-10 pt-12 text-white">
          <ListingAvatar listing={listing} size={88} className="rounded-full" />
          <p className="mt-5 text-[26px] font-semibold">{listing.name}</p>
          <p className="mt-1 t-label font-normal text-white/80 tnum" aria-live="polite">
            Calling via Answerd · {fmtDuration(sec)}
          </p>
          <p className="t-caption text-white/60 tnum">{tracked}</p>
          <div className="mt-8 grid w-full grid-cols-3 gap-6 text-center">
            {[
              { icon: Mic, label: "Mute" },
              { icon: Volume2, label: "Speaker" },
              { icon: User, label: "Contacts" },
            ].map((b) => (
              <span key={b.label} className="flex flex-col items-center gap-1.5 opacity-60">
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-white/15">
                  <b.icon className="size-6" aria-hidden />
                </span>
                <span className="t-caption">{b.label}</span>
              </span>
            ))}
          </div>
          <div className="mt-auto w-full space-y-2">
            <p className="text-center t-caption text-white/70">Prototype: choose what happened</p>
            <Button block variant="secondary" onClick={() => finish("owner")}>
              <User /> They answered
            </Button>
            {desk && (
              <Button block variant="secondary" onClick={() => finish("desk")}>
                <DeskIcon /> Answerd desk answered
              </Button>
            )}
            <Button block variant="secondary" onClick={() => finish("missed")}>
              <X /> No answer
            </Button>
            <button type="button" onClick={() => finish(sec > 4 ? "owner" : "missed")} aria-label="End call" className="mx-auto mt-3 flex size-16 items-center justify-center rounded-full bg-red text-white hover:bg-[#B91C1C]">
              <PhoneOff className="size-7" />
            </button>
          </div>
        </div>
      </AppScreen>
    )
  }

  return (
    <AppScreen id="C-20">
      <RouteSheet title={`Call ${listing.name}`} onClose={close} backdrop={<div className="h-full bg-sky" />}>
        <div className="flex items-center gap-3 rounded-2xl bg-sky p-3">
          <ListingAvatar listing={listing} size={48} />
          <div>
            <p className="t-subhead">{listing.name}</p>
            <p className="t-caption text-muted-ink tnum">via {tracked}</p>
          </div>
        </div>
        <p className="mt-4 t-body text-slate">You&apos;ll call via an Answerd number so they know you found them here.</p>
        {desk && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-teal-tint p-3 t-label font-normal text-navy">
            <DeskIcon className="mt-0.5 size-4 shrink-0 text-teal-ink" aria-hidden /> If they&apos;re busy, their Answerd desk will pick up.
          </p>
        )}
        <div className="mt-5 space-y-2">
          <Button block onClick={() => setCalling(true)}>
            <PhoneOutgoing /> Call now
          </Button>
          <Button block variant="ghost" onClick={close}>
            Cancel
          </Button>
        </div>
      </RouteSheet>
    </AppScreen>
  )
}
