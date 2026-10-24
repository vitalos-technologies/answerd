"use client"
import * as React from "react"
import { Copy, Gift, Share2, UserCheck } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { EmptyState } from "@/components/answerd/Feedback"
import { PersonAvatar } from "@/components/answerd/Media"
import { useStore } from "@/lib/store"
import { fmtDayMonth } from "@/lib/time"
import { toast } from "@/lib/toast"

/** C-36: personal code and link, share, friends who joined. */
export default function InvitePage() {
  const s = useStore()
  const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)
  const [share, setShare] = React.useState(false)
  if (!profile) return <AppScreen id="C-36" header={<TopBar title="Invite friends" back="/app/account" />}><EmptyState title="Sign in to invite friends" body="You'll get a personal link to share." /></AppScreen>
  const link = `answerd.vitalos.co.uk/invite/${profile.referralCode}`
  const joined = s.referrals.filter((r) => r.referrerUserId === profile.userId && r.kind === "invite" && r.joinedUserId)
  const pending = s.referrals.filter((r) => r.referrerUserId === profile.userId && r.kind === "invite" && !r.joinedUserId).length
  const shareVia = (via: string) => {
    s.inviteFriend()
    setShare(false)
    toast(`Invite shared via ${via} (prototype)`)
  }
  return (
    <AppScreen id="C-36" header={<TopBar title="Invite friends" back="/app/account" />}>
      <div className="space-y-4 p-4">
        <div className="rounded-3xl bg-navy p-6 text-center text-white">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-white/15">
            <Gift className="size-7" aria-hidden />
          </span>
          <p className="mt-3 text-[22px] font-bold leading-7">Help friends find local help</p>
          <p className="mt-1 t-label font-normal text-white/85">Share your link. When friends join, they show up here.</p>
          <div className="mt-5 rounded-2xl bg-white/10 p-4">
            <p className="t-caption text-white/80">Your code</p>
            <p className="font-mono text-[26px] font-bold tracking-widest">{profile.referralCode}</p>
            <p className="mt-1 truncate t-caption text-white/80">{link}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => (void navigator.clipboard?.writeText(`https://${link}`).catch(() => {}), toast("Link copied"))}>
              <Copy /> Copy link
            </Button>
            <Button onClick={() => setShare(true)}>
              <Share2 /> Share
            </Button>
          </div>
        </div>
        <section className="card p-4" aria-labelledby="joined">
          <h2 id="joined" className="t-subhead">
            Friends who joined
          </h2>
          {joined.length ? (
            <ul className="mt-3 divide-y divide-line">
              {joined.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <PersonAvatar name={r.joinedName ?? "Friend"} size={40} tone="blue" />
                  <span className="flex-1 t-label text-navy">{r.joinedName ?? "A friend"} joined</span>
                  <span className="inline-flex items-center gap-1 t-caption text-teal-ink">
                    <UserCheck className="size-4" aria-hidden /> {fmtDayMonth(r.joinsAt ?? r.at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 t-label font-normal text-slate">No one yet{pending ? `: ${pending} invite${pending > 1 ? "s" : ""} sent` : ""}. Share your link to get started.</p>
          )}
        </section>
      </div>
      <BottomSheet open={share} onClose={() => setShare(false)} title="Share your invite">
        <p className="t-label font-normal text-slate">“I use Answerd to find local help that actually picks up. Join with my link: https://{link}”</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["WhatsApp", "Messages", "Email"].map((v) => (
            <Button key={v} variant="secondary" size="md" onClick={() => shareVia(v)}>
              {v}
            </Button>
          ))}
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
