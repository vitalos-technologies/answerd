"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Briefcase, ChevronRight, CircleHelp, Gift, Heart, LogOut, MapPin, Shield, Store, UserRound } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { PersonAvatar } from "@/components/answerd/Media"
import { Mark } from "@/components/brand/Mark"
import { signInHref } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { membershipsFor } from "@/lib/selectors"
import { toast } from "@/lib/toast"

function Row({ href, icon: I, label, sub, onClick }: { href?: string; icon: typeof Bell; label: string; sub?: string; onClick?: () => void }) {
  const inner = (
    <>
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-sky text-navy">
        <I className="size-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block t-label text-navy">{label}</span>
        {sub && <span className="block truncate t-caption text-muted-ink">{sub}</span>}
      </span>
      <ChevronRight className="size-5 text-muted-ink" aria-hidden />
    </>
  )
  const cls = "flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left hover:bg-sky"
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

/** C-39 Account */
export default function AccountPage() {
  const router = useRouter()
  const s = useStore()
  const user = s.users.find((u) => u.id === s.session.userId)
  const mems = membershipsFor(s, s.session.userId)
  const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)

  return (
    <AppScreen id="C-39" tabs="customer" header={<TopBar title="Account" />}>
      <div className="space-y-4 p-4">
        {user ? (
          <Link href="/app/account/profile" className="card flex items-center gap-3 p-4 hover:border-blue">
            <PersonAvatar name={`${user.firstName} ${user.lastName}`} size={52} tone="navy" />
            <span className="min-w-0 flex-1">
              <span className="block t-subhead">
                {user.firstName} {user.lastName}
              </span>
              <span className="block t-label font-normal text-slate tnum">{user.phone || user.email}</span>
            </span>
            <span className="t-label text-blue">Edit</span>
          </Link>
        ) : (
          <div className="card p-5 text-center">
            <Mark size={48} className="mx-auto" />
            <p className="t-subhead mt-3">Sign in to message and book</p>
            <p className="mt-1 t-label font-normal text-slate">Your bookings, messages and saved businesses in one place.</p>
            <ButtonLink href={signInHref("/app/account")} block className="mt-4">
              Sign in
            </ButtonLink>
          </div>
        )}

        {user && (
          <div className="card divide-y divide-line overflow-hidden">
            <Row href="/app/saved" icon={Heart} label="Saved" sub={`${profile?.savedListingIds.length ?? 0} businesses`} />
            <Row href="/app/account/places" icon={MapPin} label="Saved places" sub={profile?.savedPlaces.map((p) => p.label).join(", ") || "Home, work and more"} />
            <Row href="/app/account/invite" icon={Gift} label="Invite friends" sub={`Your code ${profile?.referralCode ?? ""}`} />
            <Row href="/app/account/notifications" icon={Bell} label="Notifications" />
            <Row href="/app/account/privacy" icon={Shield} label="Privacy and data" />
          </div>
        )}

        <div className="card divide-y divide-line overflow-hidden">
          {mems.length ? (
            <Row
              icon={Briefcase}
              label="Switch to business mode"
              sub={mems.map((m) => s.listings.find((l) => l.businessId === m.businessId)?.name).join(", ")}
              onClick={() => {
                s.setMode("business")
                router.push("/app/biz")
              }}
            />
          ) : (
            <Row href={user ? "/app/biz/claim" : signInHref("/app/biz/claim")} icon={Store} label="List or claim your business" sub="Free. See who's trying to reach you." />
          )}
          <Row href="/app/help" icon={CircleHelp} label="Help" />
          {!user && <Row href="/app/notifications" icon={UserRound} label="Notifications" />}
        </div>

        {user && (
          <Button
            variant="secondary"
            block
            onClick={() => {
              s.signOut()
              toast("Signed out")
              router.push("/app")
            }}
          >
            <LogOut /> Sign out
          </Button>
        )}
        <p className="text-center t-caption text-muted-ink">Answerd is a Vitalos product · Version 0.1 (prototype)</p>
      </div>
    </AppScreen>
  )
}
