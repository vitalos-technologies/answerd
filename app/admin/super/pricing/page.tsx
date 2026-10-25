"use client"
import * as React from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Panel, Pill, ReasonDialog, adminInput, userName } from "@/components/admin/kit"
import { SuperPage } from "@/components/admin/super/ui"
import { Button } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import { DEFAULT_RULES, currentRuleVersion, ruleVersions, rulesFor } from "@/lib/selectors"
import { gbp } from "@/lib/format"
import { addDays, dayKey, fmtDate, fmtDateYear, fmtTime, london, ms } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { PricingRules } from "@/lib/types"

type Key = keyof PricingRules

const FIELDS: { key: Key; label: string; unit: string; money?: boolean; min: number; max: number; group: string }[] = [
  { key: "deskPricePence", label: "AI desk price", unit: "£ a month, ex VAT", money: true, min: 1, max: 500, group: "Plan prices" },
  { key: "featuredPricePence", label: "Featured price", unit: "£ a month, ex VAT", money: true, min: 1, max: 500, group: "Plan prices" },
  { key: "trialDays", label: "AI desk trial length", unit: "days", min: 1, max: 90, group: "Plan prices" },
  { key: "gateEnquiries", label: "Gate: Answerd enquiries", unit: "enquiries", min: 1, max: 100, group: "Monetise gate" },
  { key: "gateDays", label: "Gate: days after launch", unit: "days", min: 0, max: 365, group: "Monetise gate" },
  { key: "featuredSlotsPerArea", label: "Featured slots per category and area", unit: "slots (1 to 3)", min: 1, max: 3, group: "Marketplace" },
  { key: "requestExpiryHours", label: "Booking request expiry", unit: "hours", min: 1, max: 48, group: "Marketplace" },
  { key: "reviewMinChars", label: "Review: minimum text", unit: "characters", min: 0, max: 500, group: "Reviews" },
  { key: "reviewCallMinSec", label: "Review: qualifying call length", unit: "seconds", min: 0, max: 600, group: "Reviews" },
]

const show = (key: Key, v: number) => {
  const f = FIELDS.find((x) => x.key === key)!
  return f.money ? gbp(v) : `${v} ${f.unit.replace(/ \(.*\)$/, "")}`
}

function diff(a: PricingRules, b: PricingRules) {
  return FIELDS.filter((f) => a[f.key] !== b[f.key]).map((f) => `${f.label}: ${show(f.key, a[f.key])} → ${show(f.key, b[f.key])}`)
}

function RulesForm({ rules }: { rules: PricingRules }) {
  const clock = useStore((s) => s.clock)
  const [vals, setVals] = React.useState<Record<Key, string>>(() => Object.fromEntries(FIELDS.map((f) => [f.key, f.money ? (rules[f.key] / 100).toString() : String(rules[f.key])])) as Record<Key, string>)
  const [when, setWhen] = React.useState<"now" | "date">("now")
  const [date, setDate] = React.useState(dayKey(addDays(clock, 7)))
  const [errors, setErrors] = React.useState<Partial<Record<Key | "date", string>>>({})
  const [open, setOpen] = React.useState(false)
  const id = React.useId()

  const parsed = Object.fromEntries(FIELDS.map((f) => [f.key, f.money ? Math.round(Number(vals[f.key]) * 100) : Math.round(Number(vals[f.key]))])) as unknown as PricingRules
  const patch = Object.fromEntries(FIELDS.filter((f) => parsed[f.key] !== rules[f.key]).map((f) => [f.key, parsed[f.key]])) as Partial<PricingRules>
  const changed = Object.keys(patch).length > 0
  const [y, m, d] = date.split("-").map(Number)
  const effectiveAt = when === "now" ? clock : london(y!, m!, d!)

  const check = () => {
    const errs: typeof errors = {}
    for (const f of FIELDS) {
      const raw = vals[f.key].trim()
      const n = Number(raw)
      if (!raw || !Number.isFinite(n)) errs[f.key] = "Enter a number."
      else if (n < f.min || n > f.max) errs[f.key] = `Between ${f.money ? `£${f.min}` : f.min} and ${f.money ? `£${f.max}` : f.max}.`
      else if (!f.money && !Number.isInteger(n)) errs[f.key] = "Whole numbers only."
    }
    if (when === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || ms(effectiveAt) <= ms(clock))) errs.date = "Choose a date after today."
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const groups = [...new Set(FIELDS.map((f) => f.group))]
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (check()) setOpen(true)
      }}
      noValidate
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 xl:grid-cols-4">
        {groups.map((g) => (
          <fieldset key={g} className="min-w-0 space-y-3">
            <legend className="mb-1 t-caption uppercase tracking-wide text-muted-ink">{g}</legend>
            {FIELDS.filter((f) => f.group === g).map((f) => (
              <label key={f.key} className="flex flex-col gap-1">
                <span className="t-label text-navy">{f.label}</span>
                <span className="relative">
                  {f.money && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-slate">£</span>}
                  <input
                    inputMode={f.money ? "decimal" : "numeric"}
                    value={vals[f.key]}
                    onChange={(e) => {
                      setVals({ ...vals, [f.key]: e.target.value.replace(f.money ? /[^0-9.]/g : /[^0-9]/g, "") })
                      setErrors({ ...errors, [f.key]: undefined })
                    }}
                    aria-invalid={!!errors[f.key] || undefined}
                    aria-describedby={`${id}-${f.key}`}
                    className={cn(adminInput, f.money && "pl-7", parsed[f.key] !== rules[f.key] && !errors[f.key] && "border-blue bg-blue-tint/40")}
                  />
                </span>
                <span id={`${id}-${f.key}`} className={cn("t-caption", errors[f.key] ? "text-red" : "text-muted-ink")}>
                  {errors[f.key] ?? `${f.unit}${parsed[f.key] !== rules[f.key] ? ` · now ${show(f.key, rules[f.key])}` : ""}`}
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-4 border-t border-line pt-4">
        <fieldset>
          <legend className="t-label text-navy">Takes effect</legend>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <label className="inline-flex min-h-11 items-center gap-2 t-label font-normal text-navy">
              <input type="radio" name={`${id}-when`} checked={when === "now"} onChange={() => setWhen("now")} className="size-4 accent-blue" />
              Now ({fmtDate(clock)}, {fmtTime(clock)})
            </label>
            <label className="inline-flex min-h-11 items-center gap-2 t-label font-normal text-navy">
              <input type="radio" name={`${id}-when`} checked={when === "date"} onChange={() => setWhen("date")} className="size-4 accent-blue" />
              From
            </label>
            <input type="date" aria-label="Effective date" value={date} disabled={when !== "date"} onChange={(e) => setDate(e.target.value)} className={cn(adminInput, "w-44")} aria-invalid={!!errors.date || undefined} />
          </div>
          {errors.date && (
            <p className="t-caption text-red" role="alert">
              {errors.date}
            </p>
          )}
        </fieldset>
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="md"
            disabled={!changed}
            onClick={() => {
              setVals(Object.fromEntries(FIELDS.map((f) => [f.key, f.money ? (rules[f.key] / 100).toString() : String(rules[f.key])])) as Record<Key, string>)
              setErrors({})
            }}
          >
            Reset
          </Button>
          <Button type="submit" size="md" disabled={!changed}>
            Save new version
          </Button>
        </div>
      </div>
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title={when === "now" ? "Change the rules now?" : `Schedule these rules from ${fmtDate(effectiveAt)}?`}
        description={
          <span className="block">
            {diff(rules, { ...rules, ...patch }).map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
            <span className="mt-1 block">Prices apply to new subscriptions; current subscribers keep theirs.</span>
          </span>
        }
        confirmLabel={when === "now" ? "Save and apply" : "Save and schedule"}
        presets={["Price review", "Price test result", "Launch in a new city"]}
        onConfirm={(reason) => {
          useStore.getState().setRules(patch, reason, when === "now" ? undefined : effectiveAt)
          toast(when === "now" ? "New rules in force" : `Rules scheduled from ${fmtDate(effectiveAt)}`)
        }}
      />
    </form>
  )
}

/** S-06: plan prices, trial length, gate thresholds, Featured slots, request expiry and review rules; versioned with a reason and an effective date. */
export default function PricingRulesPage() {
  const s = useStore()
  const rules = rulesFor(s)
  const cur = currentRuleVersion(s)
  const versions = ruleVersions(s)
  const now = ms(s.clock)
  return (
    <SuperPage id="S-06" title="Pricing and rules" description="The numbers the whole marketplace runs on. Each save is a new version with a reason and an effective date; the app, website and admin read whichever version is in force on the demo clock.">
      <Panel title={`In force: version ${cur?.version ?? "default"}`} action={<span className="t-caption text-muted-ink">{cur ? `Since ${fmtDateYear(cur.effectiveAt)}` : ""}</span>}>
        <RulesForm key={`${cur?.id}-${versions.length}`} rules={rules} />
      </Panel>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Version history">
          <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
            <caption className="sr-only">Rule versions</caption>
            <thead>
              <tr className="border-b border-line text-left text-navy">
                <th className="py-2 font-semibold">Version</th>
                <th className="py-2 font-semibold">Effective</th>
                <th className="py-2 font-semibold">Changes</th>
                <th className="py-2 font-semibold">Reason</th>
                <th className="py-2 font-semibold">By</th>
              </tr>
            </thead>
            <tbody>
              {[...versions].reverse().map((v) => {
                const idx = versions.indexOf(v)
                const prev = idx > 0 ? { ...DEFAULT_RULES, ...versions[idx - 1]!.rules } : null
                const changes = prev ? diff(prev, { ...DEFAULT_RULES, ...v.rules }) : ["Launch values"]
                const status = cur?.id === v.id ? "In force" : ms(v.effectiveAt) > now ? "Scheduled" : "Superseded"
                return (
                  <tr key={v.id} className="border-b border-line align-top last:border-0">
                    <td className="py-2">
                      <span className="block font-medium text-navy">v{v.version}</span>
                      <Pill tone={status === "In force" ? "good" : status === "Scheduled" ? "info" : "plain"}>{status}</Pill>
                    </td>
                    <td className="py-2 tnum">{fmtDateYear(v.effectiveAt)}</td>
                    <td className="py-2">
                      {(changes.length ? changes : ["No change"]).map((c) => (
                        <span key={c} className="block">
                          {c}
                        </span>
                      ))}
                    </td>
                    <td className="max-w-[220px] py-2">{v.reason}</td>
                    <td className="py-2">
                      {userName(s.users, v.by)}
                      <span className="block t-caption text-muted-ink">{fmtDate(v.at)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>
        <Panel title="Where these rules show">
          <ul className="divide-y divide-line">
            {[
              ["B-36 Plan and billing (app)", "/app/biz/billing", `${gbp(rules.deskPricePence)} desk, gate button copy`],
              ["B-37 Featured (app)", "/app/biz/featured", `${gbp(rules.featuredPricePence)}, ${rules.featuredSlotsPerArea} slots`],
              ["W-18 Billing and checkout (web)", "/dashboard/billing", "Checkout totals"],
              ["A-18 Monetise gate", "/admin/gate", `${rules.gateEnquiries} enquiries, day ${rules.gateDays}`],
              ["A-19 Featured slots", "/admin/featured", `${rules.featuredSlotsPerArea} per category and area`],
            ].map(([label, href, sub]) => (
              <li key={href}>
                <Link href={href!} className="flex min-h-12 items-center gap-3 py-2 hover:bg-sky">
                  <span className="min-w-0 flex-1">
                    <span className="block t-label text-navy">{label}</span>
                    <span className="block t-caption text-muted-ink">{sub}</span>
                  </span>
                  <ExternalLink className="size-4 text-muted-ink" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 t-caption text-muted-ink">Booking requests expire after {rules.requestExpiryHours} hours; reviews need {rules.reviewMinChars} characters, or a call over {rules.reviewCallMinSec} seconds to qualify.</p>
        </Panel>
      </div>
    </SuperPage>
  )
}
