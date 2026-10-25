"use client"
import * as React from "react"
import Link from "next/link"
import { CheckCircle2, ImagePlus, Link2, Star, X } from "lucide-react"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Field, TextArea } from "@/components/answerd/Fields"
import { ListingAvatar } from "@/components/answerd/Media"
import { useStore } from "@/lib/store"
import { rulesFor, serviceById } from "@/lib/selectors"
import { fmtDate } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { reviewTokenState } from "./token"
import { StoreBadges } from "../ui"
import { SITE_HOST } from "../data"

const ASPECTS = [
  ["quality", "Quality"],
  ["punctuality", "Punctuality"],
  ["value", "Value"],
  ["communication", "Communication"],
] as const

/** Star radio group; size is the star's visual size, targets stay at least 44 px. */
export function StarInput({ value, onChange, size = 40, label }: { value: number; onChange: (v: number) => void; size?: number; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="inline-flex items-center justify-center rounded-lg transition-transform hover:scale-110"
          style={{ width: Math.max(44, size), height: Math.max(44, size) }}
        >
          <Star className={cn(n <= value ? "fill-amber text-amber" : "text-line")} style={{ width: size * 0.8, height: size * 0.8 }} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-10 max-sm:px-4 md:py-16">
      <div className="card mx-auto w-full max-w-xl p-6 md:p-8">{children}</div>
    </div>
  )
}

/** W-27: review from the D-06 link without installing the app. Posts through postReview. */
export function ReviewFromLink({ token }: { token: string }) {
  const s = useStore()
  const [stars, setStars] = React.useState(0)
  const [aspects, setAspects] = React.useState<Record<string, number>>({})
  const [text, setText] = React.useState("")
  const [photos, setPhotos] = React.useState<string[]>([])
  const [errors, setErrors] = React.useState<{ stars?: string; text?: string }>({})
  const [posted, setPosted] = React.useState(false)

  if (!s.hydrated) return <Shell><p className="t-body text-slate" aria-busy="true">Checking your link…</p></Shell>
  const booking = s.bookings.find((b) => b.id === token)
  const listing = booking ? s.listings.find((l) => l.id === booking.listingId) : undefined
  const state = posted ? "posted" : reviewTokenState(s, token)

  if (state === "posted" && listing) {
    return (
      <Shell>
        <div className="text-center">
          <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-teal-tint text-teal-ink">
            <CheckCircle2 className="size-9" aria-hidden />
          </span>
          <h1 className="t-title mt-4">Thanks for your review</h1>
          <p className="mt-2 t-body text-slate">It&apos;s live on {listing.name}&apos;s page and helps your neighbours choose.</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(`https://${SITE_HOST}/b/${listing.slug}`).catch(() => {})
                s.recommend(listing.id)
                toast("Link copied. Share it with a friend.")
              }}
            >
              <Link2 /> Recommend {listing.name.split(" ")[0]} to a friend
            </Button>
            <ButtonLink href={`/b/${listing.slug}#reviews`}>See your review</ButtonLink>
          </div>
          <div className="mt-8 rounded-2xl bg-sky p-5">
            <p className="t-subhead">Get the Answerd app</p>
            <p className="mt-1 t-label font-normal text-slate">Book again in two taps and get updates from businesses on your phone.</p>
            <StoreBadges className="mt-4 justify-center" />
          </div>
        </div>
      </Shell>
    )
  }

  if (state === "reviewed" && listing) {
    return (
      <Shell>
        <h1 className="t-title">You&apos;ve already reviewed this job</h1>
        <p className="mt-2 t-body text-slate">Thanks. Your review of {listing.name} is live. You can only review each booking once.</p>
        <ButtonLink href={`/b/${listing.slug}#reviews`} className="mt-6">
          See reviews
        </ButtonLink>
      </Shell>
    )
  }

  if (state === "expired" || !booking || !listing) {
    const next = booking ? `/app/bookings/${booking.id}/review` : "/account"
    return (
      <Shell>
        <h1 className="t-title">This review link has expired</h1>
        <p className="mt-2 t-body text-slate">Review links work for 30 days after the job. Sign in and you can still review it from your bookings.</p>
        <ButtonLink href={`/sign-in?next=${encodeURIComponent(next)}`} className="mt-6">
          Sign in to review
        </ButtonLink>
      </Shell>
    )
  }

  const svc = serviceById(s, booking.serviceId)
  return (
    <Shell>
      <form
        noValidate
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          const errs: typeof errors = {}
          if (!stars) errs.stars = "Choose a star rating"
          const min = rulesFor(s).reviewMinChars // R2: S-06 review rules
          if (text.trim().length < min) errs.text = `A few more words please (${Math.max(0, min - text.trim().length)} to go)`
          setErrors(errs)
          if (Object.keys(errs).length) return
          s.postReview({ listingId: listing.id, bookingId: booking.id, stars, aspects, text: text.trim(), photos, authorName: booking.customerName, customerId: booking.customerId })
          setPosted(true)
        }}
      >
        <div className="flex items-center gap-3">
          <ListingAvatar initials={listing.initials} hue={listing.hue} size={52} />
          <div className="min-w-0">
            <p className="truncate t-subhead">{listing.name}</p>
            <p className="t-caption text-muted-ink">
              {svc?.name ?? "Your booking"} · {fmtDate(booking.startAt)}
            </p>
          </div>
        </div>
        <div>
          <h1 className="t-title">How did {listing.name.split(" ")[0]} do?</h1>
          <div className="mt-2">
            <StarInput value={stars} onChange={setStars} label="Overall rating" />
          </div>
          {errors.stars && (
            <p role="alert" className="mt-1 t-caption text-red">
              {errors.stars}
            </p>
          )}
        </div>
        <fieldset className="space-y-1">
          <legend className="t-label text-navy">
            Rate the details <span className="font-normal text-muted-ink">(optional)</span>
          </legend>
          {ASPECTS.map(([k, label]) => (
            <div key={k} className="flex flex-wrap items-center justify-between gap-x-3">
              <span className="t-label font-normal text-slate">{label}</span>
              <StarInput value={aspects[k] ?? 0} onChange={(v) => setAspects((a) => ({ ...a, [k]: v }))} size={24} label={label} />
            </div>
          ))}
        </fieldset>
        <Field label="Your review" htmlFor="rv-text" error={errors.text} hint={`${text.trim().length} characters · at least ${rulesFor(s).reviewMinChars}`}>
          <TextArea id="rv-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-invalid={!!errors.text} placeholder="What went well? Would you use them again?" />
        </Field>
        <div>
          <p className="t-label text-navy">
            Photos <span className="font-normal text-muted-ink">(optional)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((p) => (
              <span key={p} className="relative inline-flex size-14 items-center justify-center rounded-xl bg-blue-tint t-caption text-blue">
                {p.replace(".jpg", "")}
                <button type="button" aria-label={`Remove ${p}`} onClick={() => setPhotos((x) => x.filter((y) => y !== p))} className="absolute -right-1.5 -top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-navy text-white">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            {photos.length < 5 && (
              <button type="button" aria-label="Add a photo" onClick={() => setPhotos((x) => [...x, `photo-${x.length + 1}.jpg`])} className="inline-flex size-14 items-center justify-center rounded-xl border border-dashed border-line text-slate hover:border-blue">
                <ImagePlus className="size-5" />
              </button>
            )}
          </div>
        </div>
        <p className="t-caption text-muted-ink">
          Posted publicly as <span className="font-semibold text-navy">{booking.customerName}</span>. Reviews follow our{" "}
          <Link href="/legal/reviews" className="text-blue underline underline-offset-2">
            review policy
          </Link>
          .
        </p>
        <Button type="submit" block>
          Post review
        </Button>
      </form>
    </Shell>
  )
}
