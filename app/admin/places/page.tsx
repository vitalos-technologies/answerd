"use client"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AdminPage, Kpi, Panel, ReasonButton, adminInput } from "@/components/admin/kit"
import { placesSkus } from "@/components/admin/data"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { placesHidden } from "@/lib/search"
import { gbp } from "@/lib/format"
import { fmtDate } from "@/lib/time"

function CapForm() {
  const cap = useStore((s) => s.settings.placesCapPence)
  const [value, setValue] = React.useState((cap / 100).toFixed(2))
  const pence = Math.round(Number(value) * 100)
  return (
    <ReasonButton
      perm="places"
      size="md"
      variant="primary"
      label="Change cap"
      title="Change the daily Places cap"
      description="When today's spend reaches the cap, gap-fill results are hidden in the app and on the web until midnight."
      confirmLabel="Save cap"
      presets={["Budget review", "Testing the cap"]}
      validate={() => (!Number.isFinite(pence) || pence < 0 ? "Enter an amount in pounds, like 20.00." : null)}
      onConfirm={(reason) => useStore.getState().updateSettings({ placesCapPence: pence }, reason)}
    >
      <label className="flex flex-col gap-1.5">
        <span className="t-label text-navy">Daily cap (£, excluding VAT)</span>
        <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))} className={adminInput} />
      </label>
    </ReasonButton>
  )
}

/** A-16: daily spend chart, cap, cache hit rate and calls by SKU; a cap below today's spend turns gap-fill off. */
export default function PlacesSpend() {
  const s = useStore()
  const days = s.placesDays
  const today = days.at(-1)
  const cap = s.settings.placesCapPence
  const hidden = placesHidden(s)
  const data = days.map((d) => ({ date: fmtDate(`${d.date}T12:00:00.000Z`), spend: d.spendPence / 100, calls: d.calls, hit: d.cacheHits / Math.max(1, d.calls) }))
  const hitToday = today ? today.cacheHits / Math.max(1, today.calls) : 0
  const hit30 = days.reduce((a, d) => a + d.cacheHits, 0) / Math.max(1, days.reduce((a, d) => a + d.calls, 0))
  const skus = today ? placesSkus(today.calls, today.spendPence) : []
  return (
    <AdminPage id="A-16" title="Places spend" perm="places" description="Google Places is the gap-fill layer. We store place IDs only and fetch details at display time." actions={<CapForm key={cap} />}>
      <div className="mb-4 grid grid-cols-4 gap-3">
        <Kpi label="Spend today" value={gbp(today?.spendPence ?? 0)} sub={`${today?.calls.toLocaleString("en-GB") ?? 0} calls, excluding VAT`} tone={hidden && s.settings.gapFillOn ? "bad" : "plain"} />
        <Kpi label="Daily cap" value={gbp(cap)} sub={hidden ? "Gap-fill off: cap reached" : `${gbp(Math.max(0, cap - (today?.spendPence ?? 0)))} left today`} />
        <Kpi label="Cache hit rate today" value={`${Math.round(hitToday * 100)}%`} sub={`30-day average ${Math.round(hit30 * 100)}%`} />
        <Kpi label="Gap-fill" value={!s.settings.gapFillOn ? "Off" : hidden ? "Paused" : "On"} href="/admin/settings" sub="Feature flag in Settings" />
      </div>
      <DataGate isEmpty={days.length === 0} empty={<EmptyState title="No spend yet" body="Places calls show here once gap-fill runs." />}>
        <Panel title="Daily spend, last 30 days">
          <div className="h-[280px]" role="img" aria-label={`Daily Places spend for the last 30 days, between ${gbp(Math.min(...days.map((d) => d.spendPence)))} and ${gbp(Math.max(...days.map((d) => d.spendPence)))}. Cap ${gbp(cap)}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 16, right: 56, bottom: 0, left: 0 }} barCategoryGap={2}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `£${v}`} width={48} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} formatter={(v) => [`£${Number(v).toFixed(2)}`, "Spend"]} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <ReferenceLine y={cap / 100} stroke="#DC2626" strokeDasharray="4 4" label={{ value: `Cap ${gbp(cap)}`, position: "right", fill: "#DC2626", fontSize: 11 }} />
                <Bar dataKey="spend" fill="#2563FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Panel title="Calls by SKU today">
            <table className="w-full text-[13.5px]" aria-label="Calls by SKU today">
              <thead>
                <tr className="border-b border-line text-left text-navy">
                  <th className="py-2 font-semibold">SKU</th>
                  <th className="py-2 text-right font-semibold">Calls</th>
                  <th className="py-2 text-right font-semibold">Spend</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((k) => (
                  <tr key={k.sku} className="border-b border-line last:border-0">
                    <td className="py-2 text-navy">{k.sku}</td>
                    <td className="py-2 text-right tnum">{k.calls.toLocaleString("en-GB")}</td>
                    <td className="py-2 text-right tnum">{gbp(k.pence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Last 7 days">
            <table className="w-full text-[13.5px]" aria-label="Spend and cache hits, last 7 days">
              <thead>
                <tr className="border-b border-line text-left text-navy">
                  <th className="py-2 font-semibold">Day</th>
                  <th className="py-2 text-right font-semibold">Calls</th>
                  <th className="py-2 text-right font-semibold">Cache hits</th>
                  <th className="py-2 text-right font-semibold">Spend</th>
                </tr>
              </thead>
              <tbody>
                {days.slice(-7).reverse().map((d) => (
                  <tr key={d.date} className="border-b border-line last:border-0">
                    <td className="py-2 text-navy">{fmtDate(`${d.date}T12:00:00.000Z`)}</td>
                    <td className="py-2 text-right tnum">{d.calls}</td>
                    <td className="py-2 text-right tnum">{Math.round((d.cacheHits / d.calls) * 100)}%</td>
                    <td className="py-2 text-right tnum">{gbp(d.spendPence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </DataGate>
    </AdminPage>
  )
}
