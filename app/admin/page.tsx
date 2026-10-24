"use client"
import Link from "next/link"
import { AdminPage, Kpi, Panel, userName } from "@/components/admin/kit"
import { overviewKpis } from "@/components/admin/data"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { gbp } from "@/lib/format"
import { fmtDate, fmtTime } from "@/lib/time"

/** A-02: KPIs computed from the store, each linking to its screen. */
export default function AdminOverview() {
  const s = useStore()
  const k = overviewKpis(s)
  const capPct = Math.round((k.placesSpend / Math.max(1, k.placesCap)) * 100)
  return (
    <AdminPage id="A-02" title="Overview" description={`Marketplace at ${fmtDate(s.clock)}, ${fmtTime(s.clock)}. Every number comes from live data and opens its screen.`}>
      <DataGate isEmpty={false} empty={<EmptyState title="No data yet" body="Run an import to add listings." />} rows={6}>
        <h2 className="mb-2 t-caption uppercase tracking-wide text-muted-ink">Listings by layer</h2>
        <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
          <Kpi label="Claimed" value={k.claimed} href="/admin/listings?layer=claimed" sub="Owners on Answerd" />
          <Kpi label="Seeded" value={k.seeded} href="/admin/listings?layer=seeded" sub="Companies House and OSM" />
          <Kpi label="Places" value={k.places} href="/admin/listings?layer=places" sub="Gap-fill, place ID only" />
          <Kpi label="Claims today" value={k.claimsToday} href="/admin/claims" sub={`${k.queues.claims} waiting in the queue`} />
          <Kpi label="Bookings this week" value={k.bookingsWeek} href="/admin/businesses" sub="Created since Monday" />
          <Kpi label="Coverage gaps" value={k.gaps} href="/admin/coverage" sub="Area × category cells under 5" tone={k.gaps > 0 ? "warn" : "plain"} />
        </div>
        <h2 className="mb-2 mt-6 t-caption uppercase tracking-wide text-muted-ink">AI desk and revenue</h2>
        <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
          <Kpi label="Desks live" value={k.desksLive} href="/admin/businesses?desk=live" sub={s.settings.killSwitch ? "Kill switch on: all paused" : "Answering calls and texts"} tone={s.settings.killSwitch ? "bad" : "plain"} />
          <Kpi label="Trials" value={k.trials} href="/admin/billing" sub="14-day desk trials running" />
          <Kpi label="Paying desks" value={k.payingDesks} href="/admin/billing" sub="£49/month ex VAT" />
          <Kpi label="MRR" value={gbp(k.mrr)} href="/admin/billing" sub="Active paid plans, ex VAT" />
          <Kpi label="Places spend today" value={gbp(k.placesSpend)} href="/admin/places" sub={`${capPct}% of the ${gbp(k.placesCap)} daily cap`} tone={capPct >= 100 ? "bad" : capPct >= 80 ? "warn" : "plain"} />
          <Kpi label="Desk QA to rate" value={k.queues.deskQa} href="/admin/desk-qa" sub="Unrated desk calls" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.4fr]">
          <Panel title="Queues">
            <ul className="divide-y divide-line">
              {[
                ["Claims", k.queues.claims, "/admin/claims", "Document claims and disputes"],
                ["Credentials", k.queues.credentials, "/admin/credentials", "Gas Safe, NICEIC, insurance, DBS"],
                ["Flagged reviews", k.queues.reviews, "/admin/reviews", "Reported by owners or customers"],
                ["Reports", k.queues.reports, "/admin/reports", "Listing and user reports"],
              ].map(([label, n, href, sub]) => (
                <li key={String(href)}>
                  <Link href={String(href)} className="flex min-h-12 items-center gap-3 py-2 hover:bg-sky">
                    <span className="min-w-0 flex-1">
                      <span className="block t-label text-navy">{label}</span>
                      <span className="block t-caption text-muted-ink">{sub}</span>
                    </span>
                    <span className={Number(n) > 0 ? "rounded-full bg-amber-tint px-2.5 py-0.5 t-label text-amber-ink tnum" : "rounded-full bg-sky px-2.5 py-0.5 t-label text-muted-ink tnum"}>{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Recent admin activity" action={<Link href="/admin/audit" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">Audit log</Link>}>
            <ul className="divide-y divide-line">
              {s.audit.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-2 text-[13.5px]">
                  <span className="w-28 shrink-0 text-muted-ink tnum">
                    {fmtDate(a.at)}, {fmtTime(a.at)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-navy">{userName(s.users, a.actorId)}</span> <span className="font-mono text-[12.5px] text-slate">{a.action}</span> <span className="text-muted-ink">{a.targetId}</span>
                    <span className="block truncate text-slate">“{a.reason}”</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </DataGate>
    </AdminPage>
  )
}
