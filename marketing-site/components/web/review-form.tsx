"use client"
import * as React from "react"
import Link from "next/link"
import { CheckCircle2, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { fill } from "@/lib/fill"
import type { pages } from "@/content/pages"
import { Field, PrototypeLabel, btnPrimary, btnSecondary, inputCls, linkCls } from "./form"

type Copy = (typeof pages)["review"]

/** Star rating as a native radio group: arrow keys, labels and form semantics come for free. */
function Stars({ name, legend, value, onChange, size, copy, describedBy }: { name: string; legend: string; value: number; onChange: (n: number) => void; size: number; copy: Copy; describedBy?: string }) {
  return (
    <fieldset aria-describedby={describedBy}>
      <legend className="sr-only">{legend}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="grid size-11 cursor-pointer place-items-center rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-blue">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" aria-label={n === 1 ? copy.starLabelOne : fill(copy.starLabel, { n })} />
            <Star aria-hidden className={cn(n <= value ? "fill-amber text-amber" : "text-muted-ink")} style={{ width: size, height: size }} strokeWidth={1.5} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * W-27: review a job from the signed link in the D-06 text, without installing the app. Prototype: posting
 * shows the thank-you with the app prompt but saves nothing.
 */
export function ReviewForm({ copy, name, slug, customer, badges }: { copy: Copy; name: string; slug: string; customer: string; badges: React.ReactNode }) {
  const [stars, setStars] = React.useState(0)
  const [aspects, setAspects] = React.useState<Record<string, number>>({})
  const [text, setText] = React.useState("")
  const [errors, setErrors] = React.useState<{ stars?: string; text?: string }>({})
  const [posted, setPosted] = React.useState(false)
  const done = React.useRef<HTMLHeadingElement>(null)
  const short = name.split(" ")[0]!

  if (posted)
    return (
      <div className="text-center">
        <span aria-hidden className="mx-auto grid size-16 place-items-center rounded-full bg-teal-tint text-teal-ink">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 ref={done} tabIndex={-1} className="mt-4 text-[28px] leading-9 font-bold text-navy outline-none">
          {copy.thanks}
        </h1>
        <p className="mt-2 text-slate">{fill(copy.thanksBody, { name })}</p>
        <Link href={`/b/${slug}`} className={cn(btnSecondary, "mt-6")}>
          {fill(copy.see, { name })}
        </Link>
        <div className="mt-8 rounded-2xl bg-sky p-5">
          <h2 className="font-semibold text-navy">{copy.appHeading}</h2>
          <p className="mt-1 text-[15px] leading-6 text-slate">{copy.appBody}</p>
          <div className="mt-4 flex justify-center">{badges}</div>
        </div>
        <div className="mt-6">
          <PrototypeLabel>{copy.prototype}</PrototypeLabel>
        </div>
      </div>
    )

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        const errs: typeof errors = {}
        if (!stars) errs.stars = copy.errors.stars
        const left = 20 - text.trim().length
        if (left > 0) errs.text = fill(copy.errors.text, { n: left })
        setErrors(errs)
        if (Object.keys(errs).length) return
        setPosted(true)
        requestAnimationFrame(() => done.current?.focus())
      }}
    >
      <div>
        <h1 className="text-[28px] leading-9 font-bold text-navy">{fill(copy.heading, { name: short })}</h1>
        <div className="mt-2">
          <Stars name="overall" legend={copy.overall} value={stars} onChange={setStars} size={34} copy={copy} describedBy={errors.stars ? "stars-err" : undefined} />
        </div>
        {errors.stars && (
          <p id="stars-err" role="alert" className="mt-1 text-[14px] leading-5 text-red">
            {errors.stars}
          </p>
        )}
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-[15px] font-semibold text-navy">
          {copy.aspectsLegend} <span className="font-normal text-muted-ink">{copy.optional}</span>
        </legend>
        {copy.aspects.map((a) => (
          <div key={a} className="flex flex-wrap items-center justify-between gap-x-3">
            <span aria-hidden className="text-[15px] text-slate">
              {a}
            </span>
            <Stars name={`aspect-${a}`} legend={a} value={aspects[a] ?? 0} onChange={(v) => setAspects((x) => ({ ...x, [a]: v }))} size={22} copy={copy} />
          </div>
        ))}
      </fieldset>
      <Field label={copy.text} htmlFor="rv-text" error={errors.text} hint={fill(copy.textHint, { n: text.trim().length })}>
        <textarea id="rv-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={copy.textPlaceholder} aria-invalid={!!errors.text || undefined} aria-describedby="rv-text-msg" className={cn(inputCls, "h-auto py-3")} />
      </Field>
      <p className="text-[14px] leading-5 text-muted-ink">
        {copy.postedAs.split(/(\{name\}|\{policy\})/).map((part, i) =>
          part === "{name}" ? (
            <strong key={i} className="font-semibold text-navy">
              {customer}
            </strong>
          ) : part === "{policy}" ? (
            <Link key={i} href="/legal/review-policy" className={linkCls}>
              {copy.policy}
            </Link>
          ) : (
            part
          ),
        )}
      </p>
      <button type="submit" className={cn(btnPrimary, "w-full")}>
        {copy.post}
      </button>
    </form>
  )
}
