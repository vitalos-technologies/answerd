"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BarChart3, Bell, ChevronRight, CircleHelp, CreditCard, Repeat, Settings, Share2, Star, Store, Users, Award, LayoutDashboard } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { ListingAvatar } from "@/components/answerd/Media"
import { useBiz, setupSteps, setupProgress } from "@/components/app/biz"
import { listingRating } from "@/lib/selectors"
import { toast } from "@/lib/toast"

function Row({ href, onClick, icon: I, label, sub }: { href?: string; onClick?: () => void; icon: typeof Store; label: string; sub?: string }) {
  const inner = (
    <>
      <I className="size-5 shrink-0 text-blue" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block t-label text-navy">{label}</span>
        {sub && <span className="block truncate t-caption text-muted-ink">{sub}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-ink" aria-hidden />
    </>
  )
  const cls = "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-sky"
  return <li>{href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>}</li>
}

/** B-41 More */
export default function MorePage() {
  const router = useRouter()
  const { s, biz, listing, role } = useBiz()
  React.useEffect(() => {
    if (s.hydrated && !biz) router.replace("/app/biz/claim")
  }, [s.hydrated, biz, router])
  const rating = listing ? listingRating(s, listing) : null
  const progress = biz && listing ? setupProgress(setupSteps(s, biz, listing)) : 0
  const team = s.members.filter((m) => m.businessId === biz?.id).length
  const plan = s.subscriptions.filter((x) => x.businessId === biz?.id && x.plan !== "free" && (x.status === "active" || x.status === "trialing"))

  return (
    <AppScreen id="B-41" biz tabs="business" header={<TopBar title="More" />}>
      <div className="space-y-4 px-4 py-4">
        {listing && (
          <Link href={`/app/b/${listing.slug}`} className="card flex items-center gap-3 p-3.5 hover:border-blue">
            <ListingAvatar initials={listing.initials} hue={listing.hue} size={48} />
            <span className="min-w-0 flex-1">
              <span className="block truncate t-subhead">{listing.name}</span>
              <span className="block t-caption text-muted-ink">{role === "owner" ? "Owner" : role === "staff" ? "Staff" : "Support view"} · See your public listing</span>
            </span>
            <ChevronRight className="size-5 text-muted-ink" aria-hidden />
          </Link>
        )}
        <ul className="card divide-y divide-line overflow-hidden">
          <Row href="/app/biz/setup" icon={Store} label="Profile and services" sub={progress < 100 ? `Setup ${progress}% done` : "Details, services, hours, area, photos"} />
          <Row href="/app/biz/stats" icon={BarChart3} label="Stats" sub="Enquiries, views and conversion" />
          <Row href="/app/biz/reviews" icon={Star} label="Reviews" sub={rating?.count ? `${rating.rating.toFixed(1)} from ${rating.count} reviews` : "No reviews yet"} />
          <Row href="/app/biz/share" icon={Share2} label="Share profile" sub="Link, QR code and review link" />
        </ul>
        <ul className="card divide-y divide-line overflow-hidden">
          <Row href="/app/biz/billing" icon={CreditCard} label="Plan and billing" sub={plan.length ? plan.map((p) => (p.plan === "desk" ? (p.status === "trialing" ? "Desk trial" : "AI desk") : "Featured")).join(", ") : "Free listing"} />
          <Row href="/app/biz/featured" icon={Award} label="Featured" sub="Top 3 in your category and area" />
          <Row href="/app/biz/team" icon={Users} label="Team" sub={`${team} ${team === 1 ? "person" : "people"}`} />
          <Row href="/app/biz/notifications" icon={Bell} label="Notifications" />
          <Row href="/app/biz/settings" icon={Settings} label="Settings" sub="Switch business, transfer, unpublish, delete" />
        </ul>
        <ul className="card divide-y divide-line overflow-hidden">
          <Row href="/dashboard" icon={LayoutDashboard} label="Web dashboard" sub="answerd.vitalos.co.uk/dashboard" />
          <Row href="/app/help" icon={CircleHelp} label="Help" />
          <Row
            icon={Repeat}
            label="Switch to customer mode"
            sub="Find, book and review local services"
            onClick={() => {
              s.setMode("customer")
              toast("Switched to customer mode")
              router.push("/app")
            }}
          />
        </ul>
      </div>
    </AppScreen>
  )
}
