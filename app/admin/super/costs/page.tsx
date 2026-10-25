"use client"
import * as React from "react"
import Link from "next/link"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Kpi, Panel, Pill, ReasonButton, adminInput } from "@/components/admin/kit"
import { ChartPanel, ChartTip, SourcePill, SuperPage, axisProps, C } from "@/components/admin/super/ui"
import { COST_LINES, UNIT_COSTS, costs, type CostKey } from "@/components/admin/super/metrics"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { rulesFor } from "@/lib/selectors"
import { gbp } from "@/lib/format"
import { toast } from "@/lib/toast"

function BudgetButton({ line, label, current }: { line: CostKey; label: string; current: number }) {
  const [value, setValue] = React.useState((current / 100).toFixed(2))
  const pence = Math.round(Number(value) * 100)
  return (
    <ReasonButton
      perm="settings"
      label="Set cap"
      title={`Monthly budget for ${label.toLowerCase()}`}
      description="We alert at 80% of the cap and again at 100%."
      confirmLabel="Save cap"
      presets={["Quarterly budget review", "Volume growing"]}
      validate={() => (!Number.isFinite(pence) || pence <= 0 ? "Enter an amount in pounds, like 150.00." : null)}
      onConfirm={(reason) => {
        useStore.getState().setBudget(line, pence, reason)
        toast(`${label} cap set to ${gbp(pence)} a month`)
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="t-label text-navy">Monthly cap (£, ex VAT)</span>
        <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))} className={adminInput} />
      </label>
    </ReasonButton>
  )
}

/** S-03: monthly cost by line, cost and margin per desk, budgets with caps and alerts. */
export default function CostsMargins() {
  const s = useStore()
  const c = costs(s)
  const rules = rulesFor(s)
  const rows = COST_LINES.map((l) => ({ ...l, pence: c.lines[l.key], value: c.lines[l.key] / 100, cap: c.budgets[l.key] }))
  return (
    <SuperPage id="S-03" title="Costs and margins" description="Last 30 days. Places spend is the recorded A-16 figure; telephony, SMS, AI reasoning and hosting are modelled from desk activity with the unit costs below.">
      <div className="mb-4 grid grid-cols-4 gap-3">
        <Kpi label="Monthly cost" value={gbp(c.total)} sub="All lines, ex VAT" />
        <Kpi label="Average cost per desk" value={gbp(c.avgDeskCost)} sub={`${c.perDesk.length} desks running`} />
        <Kpi label="Gross margin per desk" value={`${c.grossMarginPerDesk}%`} sub={`At the ${gbp(rules.deskPricePence)} list price`} tone={c.grossMarginPerDesk < 60 ? "warn" : "plain"} />
        <Kpi label="Over 80% of budget" value={rows.filter((r) => r.pence >= r.cap * 0.8).length} sub="Cost lines near or over their cap" tone={rows.some((r) => r.pence >= r.cap) ? "bad" : rows.some((r) => r.pence >= r.cap * 0.8) ? "warn" : "plain"} href="#budgets" />
      </div>
      <DataGate isEmpty={false} empty={<EmptyState title="No costs yet" body="Costs show once desks and gap-fill run." />}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
          <ChartPanel
            title="Monthly cost by line"
            source="modelled"
            summary={rows.map((r) => `${r.label}: ${gbp(r.pence)}`).join(", ")}
            table={{ head: ["Line", "Last 30 days", "Monthly cap"], rows: rows.map((r) => [r.label, gbp(r.pence), gbp(r.cap)]) }}
            height={260}
            note="Bars over 80% of their cap are amber."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, bottom: 0, left: 8 }} barCategoryGap={8}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" {...axisProps} tickFormatter={(v: number) => `£${v}`} />
                <YAxis type="category" dataKey="label" {...axisProps} axisLine={false} width={190} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} content={<ChartTip format={(v) => gbp(Math.round(v * 100))} />} />
                <Bar isAnimationActive={false} dataKey="value" name="Cost" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: C.axis, formatter: (v: unknown) => gbp(Math.round(Number(v) * 100)) }}>
                  {rows.map((r) => (
                    <Cell key={r.key} fill={r.pence >= r.cap * 0.8 ? C.amber : C.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
          <Panel title="Unit costs used" action={<SourcePill source="modelled" />}>
            <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
              <caption className="sr-only">Unit-cost assumptions</caption>
              <tbody>
                {[
                  ["Answerd number", `${gbp(UNIT_COSTS.numberMonthlyPence)} a month each`],
                  ["Desk voice minutes", `${UNIT_COSTS.voicePerMinPence}p a minute`],
                  ["SMS sent by the desk", `${UNIT_COSTS.smsPence}p each`],
                  ["AI reasoning", `${UNIT_COSTS.aiPerTurnPence}p per desk turn`],
                  ["Hosting", `${gbp(UNIT_COSTS.hostingMonthlyPence)} a month, flat`],
                  ["Google Places", "Recorded daily spend (A-16)"],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-line last:border-0">
                    <th scope="row" className="py-2 text-left font-medium text-navy">{k}</th>
                    <td className="py-2 text-right text-slate">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 t-caption text-muted-ink">Assumptions for the prototype until the telephony, AI and hosting bills are connected (S-08).</p>
          </Panel>
        </div>

        <Panel title="Budgets and caps" className="mt-4" id="budgets">
          <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
            <caption className="sr-only">Budgets and caps</caption>
            <thead>
              <tr className="border-b border-line text-left text-navy">
                <th className="py-2 font-semibold">Line</th>
                <th className="py-2 text-right font-semibold">Last 30 days</th>
                <th className="py-2 text-right font-semibold">Monthly cap</th>
                <th className="py-2 pl-4 font-semibold">Used</th>
                <th className="py-2 font-semibold">Alert</th>
                <th className="py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const used = Math.round((r.pence / Math.max(1, r.cap)) * 100)
                return (
                  <tr key={r.key} className="border-b border-line last:border-0">
                    <th scope="row" className="py-2 text-left font-medium text-navy">{r.label}</th>
                    <td className="py-2 text-right tnum">{gbp(r.pence)}</td>
                    <td className="py-2 text-right tnum">{gbp(r.cap)}</td>
                    <td className="py-2 pl-4">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-28 overflow-hidden rounded-full bg-sky" aria-hidden>
                          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, used)}%`, background: used >= 80 ? C.amber : C.blue }} />
                        </span>
                        <span className="tnum">{used}%</span>
                      </span>
                    </td>
                    <td className="py-2">{used >= 100 ? <Pill tone="bad">Over cap</Pill> : used >= 80 ? <Pill tone="warn">Near cap</Pill> : <Pill tone="good">OK</Pill>}</td>
                    <td className="py-2 text-right">{r.key === "places" ? <Link href="/admin/places" className="inline-flex min-h-10 items-center t-label text-blue hover:underline">Daily cap in A-16</Link> : <BudgetButton key={r.cap} line={r.key} label={r.label} current={r.cap} />}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>

        <Panel title="Cost and margin per desk" className="mt-4" action={<SourcePill source="modelled" />}>
          <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
            <caption className="sr-only">Cost and margin per desk, last 30 days</caption>
            <thead>
              <tr className="border-b border-line text-left text-navy">
                <th className="py-2 font-semibold">Business</th>
                <th className="py-2 font-semibold">Desk</th>
                <th className="py-2 text-right font-semibold">Minutes</th>
                <th className="py-2 text-right font-semibold">Desk turns</th>
                <th className="py-2 text-right font-semibold">Cost</th>
                <th className="py-2 text-right font-semibold">Revenue</th>
                <th className="py-2 text-right font-semibold">Margin at list price</th>
              </tr>
            </thead>
            <tbody>
              {c.perDesk.map((d) => (
                <tr key={d.businessId} className="border-b border-line last:border-0">
                  <td className="py-2 text-navy">{d.name}</td>
                  <td className="py-2">
                    <Pill tone={d.status === "live" ? "good" : d.status === "trial" ? "info" : d.status === "paused" ? "warn" : "plain"}>{d.status}</Pill>
                  </td>
                  <td className="py-2 text-right tnum">{d.minutes}</td>
                  <td className="py-2 text-right tnum">{d.turns}</td>
                  <td className="py-2 text-right tnum">{gbp(d.cost)}</td>
                  <td className="py-2 text-right tnum">{d.revenue ? gbp(d.revenue) : "Trial"}</td>
                  <td className="py-2 text-right tnum">{gbp(d.marginAtList)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </DataGate>
    </SuperPage>
  )
}
