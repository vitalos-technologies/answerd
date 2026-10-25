"use client"
import Link from "next/link"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Kpi, Panel, Pill } from "@/components/admin/kit"
import { ChartPanel, ChartTip, SourcePill, SuperPage, axisProps, C } from "@/components/admin/super/ui"
import { gateBreakdown, priceTest, revenue } from "@/components/admin/super/metrics"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { gbp } from "@/lib/format"
import { fmtDate, fmtDateYear } from "@/lib/time"

/** S-02: MRR by plan, trials ending, gate status across businesses, the price test, refunds and credits. */
export default function RevenuePlans() {
  const s = useStore()
  const r = revenue(s)
  const gate = gateBreakdown(s)
  const test = priceTest(s)
  const nameOf = (bid: string) => s.listings.find((l) => l.businessId === bid)?.name ?? bid
  const mrrRows = [
    { plan: "AI desk", value: r.deskMrr / 100, fill: C.blue },
    { plan: "Featured", value: r.featMrr / 100, fill: C.teal },
    { plan: "Trials at list price", value: r.potentialMrr / 100, fill: C.amber },
  ]
  const gateRows = [
    { label: "Open", n: gate.open, fill: C.teal },
    { label: "Enquiries met, waiting for the date", n: gate.enquiriesOnly, fill: C.blue },
    { label: "Date met, short of enquiries", n: gate.dateOnly, fill: C.navy },
    { label: "Neither yet", n: gate.neither, fill: C.sky },
  ]
  return (
    <SuperPage id="S-02" title="Revenue and plans" description={`List prices from Pricing and rules: AI desk ${gbp(r.rules.deskPricePence)}/month, Featured ${gbp(r.rules.featuredPricePence)}/month, both ex VAT. Existing subscribers keep the price they signed up at.`}>
      <div className="mb-4 grid grid-cols-4 gap-3">
        <Kpi label="MRR" value={gbp(r.mrr)} sub={`Run-rate ${gbp(r.runRate)}`} />
        <Kpi label="AI desk MRR" value={gbp(r.deskMrr)} sub={`${r.paidDesks} paying desk${r.paidDesks === 1 ? "" : "s"}`} />
        <Kpi label="Featured MRR" value={gbp(r.featMrr)} sub="Active Featured slots" href="/admin/featured" />
        <Kpi label="Trials ending this week" value={r.endingWeek.length} sub={`${r.trials.length} trials running`} tone={r.endingWeek.length ? "warn" : "plain"} />
      </div>
      <DataGate isEmpty={false} empty={<EmptyState title="No revenue yet" body="Paid plans show here once businesses pass the monetise gate." />}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartPanel
            title="MRR by plan"
            source="live"
            summary={`AI desk ${gbp(r.deskMrr)}, Featured ${gbp(r.featMrr)}. If every running trial converted at list price: ${gbp(r.potentialMrr)} more.`}
            table={{ head: ["Plan", "MRR"], rows: mrrRows.map((x) => [x.plan, gbp(x.value * 100)]) }}
            note="Amber: what running trials would add at today's list price, not booked revenue."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrRows} margin={{ top: 16, right: 8, bottom: 0, left: 0 }} barCategoryGap={24}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="plan" {...axisProps} />
                <YAxis {...axisProps} axisLine={false} width={48} tickFormatter={(v: number) => `£${v}`} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} content={<ChartTip format={(v) => gbp(v * 100)} />} />
                <Bar isAnimationActive={false} dataKey="value" name="MRR" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: C.axis, formatter: (v: unknown) => gbp(Number(v) * 100) }}>
                  {mrrRows.map((x) => (
                    <Cell key={x.plan} fill={x.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ChartPanel
            title="Monetise gate across businesses"
            source="live"
            summary={gateRows.map((x) => `${x.label}: ${x.n}`).join(", ")}
            table={{ head: ["Gate", "Businesses"], rows: gateRows.map((x) => [x.label, x.n]) }}
            note={
              <>
                {gate.overrides} admin override{gate.overrides === 1 ? "" : "s"}. Rule: {r.rules.gateEnquiries} enquiries and day {r.rules.gateDays}.{" "}
                <Link href="/admin/gate" className="text-blue hover:underline">
                  Open Monetise gate
                </Link>
              </>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gateRows} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 8 }} barCategoryGap={8}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" {...axisProps} allowDecimals={false} />
                <YAxis type="category" dataKey="label" {...axisProps} axisLine={false} width={200} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} content={<ChartTip />} />
                <Bar isAnimationActive={false} dataKey="n" name="Businesses" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: C.axis }}>
                  {gateRows.map((x) => (
                    <Cell key={x.label} fill={x.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Trials ending this week">
            {r.endingWeek.length ? (
              <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
                <caption className="sr-only">Trials ending this week</caption>
                <thead>
                  <tr className="border-b border-line text-left text-navy">
                    <th className="py-2 font-semibold">Business</th>
                    <th className="py-2 font-semibold">Trial ends</th>
                    <th className="py-2 text-right font-semibold">Then</th>
                  </tr>
                </thead>
                <tbody>
                  {r.endingWeek.map((x) => (
                    <tr key={x.id} className="border-b border-line last:border-0">
                      <td className="py-2 text-navy">{nameOf(x.businessId)}</td>
                      <td className="py-2 tnum">{fmtDate(x.currentPeriodEnd)}</td>
                      <td className="py-2 text-right tnum">{gbp(r.rules.deskPricePence)}/month</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="t-body text-slate">No trials end in the next 7 days.</p>
            )}
          </Panel>
          <Panel title="Refunds and credits" action={<Link href="/admin/billing" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">Open Billing</Link>}>
            {r.refunds.length ? (
              <ul className="divide-y divide-line">
                {r.refunds.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-2 text-[13.5px]">
                    <span className="min-w-0 flex-1 text-navy">{nameOf(i.businessId)} · {i.description}</span>
                    <span className="tnum text-slate">{fmtDateYear(i.at)}</span>
                    <span className="tnum font-medium text-navy">{gbp(i.amountPence)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="t-body text-slate">No refunds or credits issued. Refunds are made from Billing (A-17), with a reason.</p>
            )}
          </Panel>
        </div>

        <Panel title="Price test: AI desk at £39, £49 and £69" className="mt-4" action={<SourcePill source="simulated" />}>
          <p className="mb-3 t-label font-normal text-slate">Simulated from the demo seed to show how results will read. No business has been shown a test price; these are not real results.</p>
          <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
            <caption className="sr-only">Price test arms</caption>
            <thead>
              <tr className="border-b border-line text-left text-navy">
                <th className="py-2 font-semibold">Arm</th>
                <th className="py-2 text-right font-semibold">Shown the price</th>
                <th className="py-2 text-right font-semibold">Started a trial</th>
                <th className="py-2 text-right font-semibold">Paid</th>
                <th className="py-2 text-right font-semibold">Conversion</th>
                <th className="py-2 text-right font-semibold">MRR per 100 shown</th>
              </tr>
            </thead>
            <tbody>
              {test.map((a) => (
                <tr key={a.price} className="border-b border-line last:border-0">
                  <td className="py-2 text-navy">
                    {gbp(a.price)}/month {a.price === r.rules.deskPricePence && <Pill tone="info">Current list price</Pill>}
                  </td>
                  <td className="py-2 text-right tnum">{a.shown}</td>
                  <td className="py-2 text-right tnum">{a.trials}</td>
                  <td className="py-2 text-right tnum">{a.paid}</td>
                  <td className="py-2 text-right tnum">{a.conversion}%</td>
                  <td className="py-2 text-right tnum">{gbp(a.mrrPerHundred)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 t-caption text-muted-ink">
            To change the list price, add a new version in{" "}
            <Link href="/admin/super/pricing" className="text-blue hover:underline">
              Pricing and rules
            </Link>
            .
          </p>
        </Panel>
      </DataGate>
    </SuperPage>
  )
}
