import Link from "next/link"
import { CircleCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { pages } from "@/content/pages"
import { btnPrimary, btnSecondary } from "./form"

const gbp = (pence: number) => `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: pence % 100 ? 2 : 0, maximumFractionDigits: 2 })}`

/** The three public plans (W-10), from the billing copy so the prices live in one place. */
export function PlanCards({ cta, ctaFree, compact = false }: { cta: string; ctaFree: string; compact?: boolean }) {
  const b = pages.billing
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {b.plans.map((p) => {
        const featured = p.plan === "desk"
        return (
          <li key={p.plan} className={cn("card-site flex flex-col p-6 md:p-7", featured && "ring-2 ring-blue")}>
            <h3 className="t-card-title">{p.name}</h3>
            <p className="mt-3 flex items-baseline gap-1 text-navy">
              <span className="tnum text-[40px] leading-none font-bold tracking-[-0.02em]">{gbp(p.price)}</span>
              {p.price > 0 ? <span className="text-slate">{b.perMonth}</span> : <span className="text-slate">· {b.freeForGood}</span>}
            </p>
            {p.price > 0 && <p className="t-small mt-1 text-muted-ink">ex VAT</p>}
            {"trial" in p && p.trial && <p className="mt-3 inline-flex w-fit rounded-full bg-teal-tint px-3 py-1 text-[14px] font-semibold text-teal-ink">{p.trial}</p>}
            {!compact && (
              <ul className="mt-5 flex flex-col gap-3">
                {p.lines.map((l) => (
                  <li key={l} className="flex items-start gap-2.5 text-navy">
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto pt-6">
              <Link href="/claim" className={cn(featured ? btnPrimary : btnSecondary, "w-full")}>
                {p.price > 0 ? cta : ctaFree}
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
