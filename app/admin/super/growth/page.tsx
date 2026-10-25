"use client"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Kpi, Panel } from "@/components/admin/kit"
import { ChartPanel, ChartTip, SuperPage, axisProps, C } from "@/components/admin/super/ui"
import { activeWeeks, claimFunnel, customerCount, funnel, growthBy, installWeeks, pct } from "@/components/admin/super/metrics"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { SegmentedControl } from "@/components/answerd/Status"
import { useStore } from "@/lib/store"

const RESULTS_PER_SEARCH = 8

/** S-04: customers, installs, searches, contact and booking rates, referrals; the claim funnel; by focus city and category. */
export default function Growth() {
  const s = useStore()
  const [split, setSplit] = React.useState<"city" | "category">("city")
  const f = funnel(s)
  const [appear, views, contacts, bookings] = f.map((x) => x.n)
  const searches = Math.round(appear! / RESULTS_PER_SEARCH)
  const active = activeWeeks(s)
  const installs = installWeeks(s)
  const claim = claimFunnel(s)
  const by = growthBy(s, split)
  const joined = s.referrals.filter((r) => r.joinedUserId).length
  return (
    <SuperPage id="S-04" title="Growth" description="Last 30 days unless marked. Searches are estimated from listing appearances in results; installs are modelled from accounts.">
      <div className="mb-4 grid grid-cols-3 gap-3 xl:grid-cols-6">
        <Kpi label="Customer accounts" value={customerCount(s)} sub="Signed up in the app" href="/admin/customers" />
        <Kpi label="Installs, 8 weeks" value={installs.reduce((a, w) => a + w.installs, 0)} sub="Modelled from accounts" />
        <Kpi label="Searches" value={searches.toLocaleString("en-GB")} sub={`${appear!.toLocaleString("en-GB")} appearances ÷ ${RESULTS_PER_SEARCH}`} />
        <Kpi label="Contact rate" value={`${pct(contacts!, views!)}%`} sub="Calls and messages per listing view" />
        <Kpi label="Booking rate" value={`${pct(bookings!, contacts!)}%`} sub="Bookings per call or message" />
        <Kpi label="Referrals" value={s.referrals.length} sub={`${joined} friend${joined === 1 ? "" : "s"} joined`} />
      </div>
      <DataGate isEmpty={false} empty={<EmptyState title="No activity yet" body="Growth numbers show once customers start searching." />}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartPanel
            title="Active customers"
            source="live"
            legend={[
              { label: "Weekly active", color: C.blue },
              { label: "Monthly active", color: C.teal },
            ]}
            summary={`Weekly and monthly active customers over 8 weeks; latest ${active.at(-1)!.weekly} weekly and ${active.at(-1)!.monthly} monthly.`}
            table={{ head: ["Week of", "Weekly active", "Monthly active"], rows: active.map((w) => [w.label, w.weekly, w.monthly]) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={active} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} axisLine={false} width={32} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Line isAnimationActive={false} type="monotone" dataKey="weekly" name="Weekly active" stroke={C.blue} strokeWidth={2} dot={{ r: 4, fill: C.blue, stroke: "#fff", strokeWidth: 2 }} />
                <Line isAnimationActive={false} type="monotone" dataKey="monthly" name="Monthly active" stroke={C.teal} strokeWidth={2} dot={{ r: 4, fill: C.teal, stroke: "#fff", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ChartPanel
            title="App installs by week"
            source="modelled"
            summary={`Modelled weekly installs, ${installs.map((w) => w.installs).join(", ")}.`}
            table={{ head: ["Week of", "Installs (modelled)"], rows: installs.map((w) => [w.label, w.installs]) }}
            note="Store install counts aren't connected in the prototype; this models them from accounts created."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={installs} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={10}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} axisLine={false} width={32} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} content={<ChartTip />} />
                <Bar isAnimationActive={false} dataKey="installs" name="Installs" fill={C.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        <ChartPanel
          className="mt-4"
          title="Claim funnel"
          source="live"
          summary={claim.map((x) => `${x.step}: ${x.n}`).join(", ")}
          table={{ head: ["Step", "Businesses", "From the step before"], rows: claim.map((x, i) => [x.step, x.n, i > 1 ? `${pct(x.n, claim[i - 1]!.n)}%` : "—"]) }}
          note="Unclaimed listings (seeded and Places) → claimed → setup done → desk trial → paid. Paid is highlighted."
          height={200}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={claim} margin={{ top: 16, right: 8, bottom: 0, left: 0 }} barCategoryGap={18}>
              <CartesianGrid vertical={false} stroke={C.grid} />
              <XAxis dataKey="step" {...axisProps} />
              <YAxis {...axisProps} axisLine={false} width={32} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#F1F5F9" }} content={<ChartTip />} />
              <Bar isAnimationActive={false} dataKey="n" name="Businesses" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: C.axis }}>
                {claim.map((x, i) => (
                  <Cell key={x.step} fill={i === claim.length - 1 ? C.amber : C.navy} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <Panel
          className="mt-4"
          title={split === "city" ? "By focus city" : "By category"}
          action={
            <SegmentedControl
              label="Split by"
              value={split}
              onChange={setSplit}
              className="w-[240px]"
              options={[
                { value: "city", label: "City" },
                { value: "category", label: "Category" },
              ]}
            />
          }
        >
          <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
            <caption className="sr-only">{split === "city" ? "Growth by focus city" : "Growth by category"}</caption>
            <thead>
              <tr className="border-b border-line text-left text-navy">
                <th className="py-2 font-semibold">{split === "city" ? "City" : "Category"}</th>
                <th className="py-2 text-right font-semibold">Listings</th>
                <th className="py-2 text-right font-semibold">Claimed</th>
                <th className="py-2 text-right font-semibold">Desk trial</th>
                <th className="py-2 text-right font-semibold">Paid</th>
                <th className="py-2 text-right font-semibold">Views</th>
                <th className="py-2 text-right font-semibold">Contact rate</th>
                <th className="py-2 text-right font-semibold">Booking rate</th>
              </tr>
            </thead>
            <tbody>
              {by.map((g) => (
                <tr key={g.id} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2 text-left font-medium text-navy">{g.name}</th>
                  <td className="py-2 text-right tnum">{g.listings}</td>
                  <td className="py-2 text-right tnum">{g.claimed}</td>
                  <td className="py-2 text-right tnum">{g.trial}</td>
                  <td className="py-2 text-right tnum">{g.paid}</td>
                  <td className="py-2 text-right tnum">{g.views}</td>
                  <td className="py-2 text-right tnum">{g.contactRate}%</td>
                  <td className="py-2 text-right tnum">{g.bookingRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </DataGate>
    </SuperPage>
  )
}
