"use client"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Kpi, Panel } from "@/components/admin/kit"
import { ChartPanel, ChartTip, SuperPage, axisProps, C } from "@/components/admin/super/ui"
import { activeCustomers, alerts, costs, customerCount, enquiryWeeks, funnel, installWeeks, pct, revenue } from "@/components/admin/super/metrics"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { gbp } from "@/lib/format"
import { fmtDate, fmtTime } from "@/lib/time"
import { cn } from "@/lib/utils"

/** S-01: the owner's view of the business: revenue, margin, activity, the funnel and alerts. */
export default function SuperOverview() {
  const s = useStore()
  const r = revenue(s)
  const c = costs(s)
  const weeks = enquiryWeeks(s, 8)
  const thisWeek = weeks.at(-1)!
  const f = funnel(s)
  const al = alerts(s)
  const installs = installWeeks(s).reduce((a, w) => a + w.installs, 0)
  const wau = activeCustomers(s, 7)
  const mau = activeCustomers(s, 30)
  return (
    <SuperPage id="S-01" title="Owner overview" description={`Answerd at ${fmtDate(s.clock)}, ${fmtTime(s.clock)}. Live figures are counted from the demo records; anything modelled says so. Prices ex VAT.`}>
      <DataGate isEmpty={false} empty={<EmptyState title="No data yet" body="Numbers appear once businesses and customers are active." />} rows={6}>
        <h2 className="mb-2 t-caption uppercase tracking-wide text-muted-ink">Money</h2>
        <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
          <Kpi label="MRR" value={gbp(r.mrr)} href="/admin/super/revenue" sub={`AI desk ${gbp(r.deskMrr)} · Featured ${gbp(r.featMrr)}`} />
          <Kpi label="Run-rate" value={gbp(r.runRate)} href="/admin/super/revenue" sub="MRR × 12" />
          <Kpi label="Paying businesses" value={r.paying} href="/admin/super/revenue" sub={`${r.trials.length} on a desk trial`} />
          <Kpi label="Trial to paid" value={r.trialToPaid === null ? "—" : `${r.trialToPaid}%`} href="/admin/super/revenue" sub={r.trialToPaid === null ? "No trials have finished yet" : `${r.paidDesks} of ${r.trialFinished} finished trials`} />
          <Kpi label="Churn" value={`${r.churnRate}%`} href="/admin/super/revenue" sub={`${r.churned} cancelled or lapsed`} />
          <Kpi label="Gross margin per desk" value={`${c.grossMarginPerDesk}%`} href="/admin/super/costs" sub={`At ${gbp(r.rules.deskPricePence)} less ${gbp(c.avgDeskCost)} average cost (modelled)`} tone={c.grossMarginPerDesk < 60 ? "warn" : "plain"} />
        </div>
        <h2 className="mb-2 mt-6 t-caption uppercase tracking-wide text-muted-ink">Marketplace</h2>
        <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
          <Kpi label="Enquiries sent this week" value={thisWeek.calls + thisWeek.messages + thisWeek.bookings} href="/admin/super/growth" sub={`${thisWeek.calls} calls, ${thisWeek.messages} messages, ${thisWeek.bookings} bookings`} />
          <Kpi label="Bookings this week" value={thisWeek.bookings} href="/admin/businesses" sub="Created since Monday" />
          <Kpi label="Weekly active customers" value={wau} href="/admin/super/growth" sub="Booked, messaged, called or reviewed" />
          <Kpi label="Monthly active customers" value={mau} href="/admin/super/growth" sub="Same, last 30 days" />
          <Kpi label="Customer accounts" value={customerCount(s)} href="/admin/customers" sub="Signed up in the app" />
          <Kpi label="App installs, 8 weeks" value={installs} href="/admin/super/growth" sub="Modelled from accounts" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
          <ChartPanel
            title="Enquiries sent to businesses, by week"
            source="live"
            legend={[
              { label: "Calls", color: C.blue },
              { label: "Messages", color: C.teal },
              { label: "Bookings", color: C.navy },
            ]}
            summary={`Weekly calls, messages and bookings for the last 8 weeks. This week: ${thisWeek.calls} calls, ${thisWeek.messages} messages, ${thisWeek.bookings} bookings.`}
            table={{ head: ["Week of", "Calls", "Messages", "Bookings"], rows: weeks.map((w) => [w.label, w.calls, w.messages, w.bookings]) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={8}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} axisLine={false} width={32} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} content={<ChartTip />} />
                <Bar isAnimationActive={false} dataKey="calls" name="Calls" stackId="e" fill={C.blue} stroke="#fff" strokeWidth={1} />
                <Bar isAnimationActive={false} dataKey="messages" name="Messages" stackId="e" fill={C.teal} stroke="#fff" strokeWidth={1} />
                <Bar isAnimationActive={false} dataKey="bookings" name="Bookings" stackId="e" fill={C.navy} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ChartPanel
            title="Funnel, last 30 days"
            source="live"
            summary={f.map((x) => `${x.step}: ${x.n}`).join(", ")}
            table={{ head: ["Step", "Count", "From the step before"], rows: f.map((x, i) => [x.step, x.n.toLocaleString("en-GB"), i ? `${pct(x.n, f[i - 1]!.n)}%` : "—"]) }}
            note="Search to contact to booking to review (reviews linked to a booking or call). Bars use a square-root scale so small steps stay visible; the last step is highlighted."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={f} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 8 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" scale="sqrt" hide />
                <YAxis type="category" dataKey="step" {...axisProps} axisLine={false} width={120} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} content={<ChartTip format={(v) => v.toLocaleString("en-GB")} />} />
                <Bar isAnimationActive={false} dataKey="n" name="Count" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: C.axis }}>
                  {f.map((x, i) => (
                    <Cell key={x.step} fill={i === f.length - 1 ? C.amber : C.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
        <Panel title="Alerts" className="mt-4">
          <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {al.map((a) => {
              const I = a.tone === "good" ? CheckCircle2 : a.tone === "warn" ? AlertTriangle : XCircle
              return (
                <li key={a.title}>
                  <Link href={a.href} className={cn("flex min-h-14 items-start gap-3 rounded-xl border p-3 hover:border-blue", a.tone === "bad" ? "border-red bg-red-tint" : a.tone === "warn" ? "border-amber bg-amber-tint" : "border-line")}>
                    <I className={cn("mt-0.5 size-5 shrink-0", a.tone === "good" ? "text-teal-ink" : a.tone === "warn" ? "text-amber-ink" : "text-red")} aria-hidden />
                    <span className="min-w-0">
                      <span className="block t-label text-navy">{a.title}</span>
                      <span className="block t-caption text-slate">{a.body}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>
      </DataGate>
    </SuperPage>
  )
}
