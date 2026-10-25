"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Star, X } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { Field, TextArea } from "@/components/answerd/Fields"
import { ListingAvatar } from "@/components/answerd/Media"
import { useStore } from "@/lib/store"
import type { Listing } from "@/lib/types"
import { cn } from "@/lib/utils"
import { rulesFor } from "@/lib/selectors"

const ASPECTS = [
  ["quality", "Quality"],
  ["punctuality", "Punctuality"],
  ["value", "Value"],
  ["communication", "Communication"],
] as const

function StarInput({ value, onChange, size = 40, label }: { value: number; onChange: (v: number) => void; size?: number; label: string }) {
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
          className="inline-flex items-center justify-center rounded-lg hover:scale-110"
          style={{ width: Math.max(44, size), height: Math.max(44, size) }}
        >
          <Star className={cn(n <= value ? "fill-amber text-amber" : "text-line")} style={{ width: size * 0.8, height: size * 0.8 }} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

/** C-34: stars required, aspects optional, text at least 20 characters, photos, posted publicly. */
export function ReviewForm({ listing, bookingId, callId, doneHref }: { listing: Listing; bookingId?: string; callId?: string; doneHref: string }) {
  const router = useRouter()
  const s = useStore()
  const user = s.users.find((u) => u.id === s.session.userId)
  const [stars, setStars] = React.useState(0)
  const [aspects, setAspects] = React.useState<Record<string, number>>({})
  const [text, setText] = React.useState("")
  const [photos, setPhotos] = React.useState<string[]>([])
  const [errors, setErrors] = React.useState<{ stars?: string; text?: string }>({})
  const publicName = user ? `${user.firstName} ${user.lastName[0] ?? ""}.` : "Customer"

  return (
    <AppScreen id="C-34" bg="white" header={<TopBar title="Write a review" close />}>
      <form
        className="space-y-6 px-4 py-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          const errs: typeof errors = {}
          if (!stars) errs.stars = "Choose a star rating"
          const min = rulesFor(s).reviewMinChars // R2: S-06 review rules
          if (text.trim().length < min) errs.text = `A few more words please (${Math.max(0, min - text.trim().length)} to go)`
          setErrors(errs)
          if (Object.keys(errs).length) return
          s.postReview({ listingId: listing.id, bookingId, callId, stars, aspects, text: text.trim(), photos })
          router.replace(doneHref)
        }}
      >
        <div className="flex items-center gap-3">
          <ListingAvatar initials={listing.initials} hue={listing.hue} size={48} />
          <p className="t-subhead">{listing.name}</p>
        </div>
        <div>
          <p className="t-title">How did they do?</p>
          <StarInput value={stars} onChange={setStars} label="Overall rating" />
          {errors.stars && (
            <p role="alert" className="mt-1 t-caption text-red">
              {errors.stars}
            </p>
          )}
        </div>
        <fieldset className="space-y-2">
          <legend className="t-label text-navy">
            Rate the details <span className="font-normal text-muted-ink">(optional)</span>
          </legend>
          {ASPECTS.map(([k, label]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="t-label font-normal text-slate">{label}</span>
              <StarInput value={aspects[k] ?? 0} onChange={(v) => setAspects((a) => ({ ...a, [k]: v }))} size={24} label={label} />
            </div>
          ))}
        </fieldset>
        <Field label="Your review" htmlFor="text" error={errors.text} hint={`${text.trim().length} characters · at least ${rulesFor(s).reviewMinChars}`}>
          <TextArea id="text" rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-invalid={!!errors.text} placeholder="What went well? Would you use them again?" />
        </Field>
        <div>
          <p className="t-label text-navy">
            Photos <span className="font-normal text-muted-ink">(optional)</span>
          </p>
          <div className="mt-2 flex gap-2">
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
          Posted publicly as <span className="font-semibold text-navy">{publicName}</span>. Reviews follow our review policy.
        </p>
        <Button block type="submit">
          Post review
        </Button>
      </form>
    </AppScreen>
  )
}

export function ReviewNotAllowed({ reason, back }: { reason: string; back: string }) {
  return (
    <AppScreen id="C-34" header={<TopBar title="Write a review" back={back} />}>
      <EmptyState title="You can't review this yet" body={reason} action={<ButtonLink href={back} size="md">Go back</ButtonLink>} />
    </AppScreen>
  )
}
