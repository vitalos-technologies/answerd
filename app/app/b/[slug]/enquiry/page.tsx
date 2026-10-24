"use client"
import * as React from "react"
import { use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ImagePlus, X } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { Field, TextArea, TextInput, Chip } from "@/components/answerd/Fields"
import { ListingMini, ListingNotFound } from "@/components/app/listing"
import { signInHref, withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { listingBySlug } from "@/lib/selectors"
import { lookupPostcode } from "@/lib/geo"

const WHEN = ["ASAP", "This week", "Flexible"] as const

/** C-23: the first message to a business, as a short structured enquiry. */
function Enquiry({ slug }: { slug: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const s = useStore()
  const listing = listingBySlug(s, slug)
  const [text, setText] = React.useState(sp.get("text") ?? "")
  const [photos, setPhotos] = React.useState<string[]>([])
  const [postcode, setPostcode] = React.useState(sp.get("postcode") ?? s.session.location?.postcode ?? "")
  const [when, setWhen] = React.useState<(typeof WHEN)[number]>((sp.get("when") as (typeof WHEN)[number]) ?? "This week")
  const [errors, setErrors] = React.useState<{ text?: string; postcode?: string }>({})

  React.useEffect(() => {
    if (!s.session.userId) router.replace(signInHref(`/app/b/${slug}/enquiry${sp.toString() ? `?${sp}` : ""}`))
  }, [s.session.userId, router, slug, sp])
  if (!listing) return <AppScreen id="C-23"><ListingNotFound /></AppScreen>

  return (
    <AppScreen id="C-23" bg="white" header={<TopBar title="New enquiry" close />}>
      <ListingMini listing={listing} subtitle="Your message goes to their inbox" />
      <form
        className="space-y-5 px-4 py-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          const errs: typeof errors = {}
          if (text.trim().length < 10) errs.text = "Tell them a little more (at least 10 characters)"
          if (postcode && !lookupPostcode(postcode)) errs.postcode = "Check the postcode, for example SE25 4AA"
          setErrors(errs)
          if (Object.keys(errs).length) return
          const id = s.startThread(listing.id, { body: text.trim(), photos, postcode: postcode.toUpperCase(), when })
          const desk = s.deskConfigs.find((c) => c.businessId === listing.businessId)?.status === "live" && !s.settings.killSwitch
          if (desk && !s.offline) setTimeout(() => useStore.getState().deskAutoReply(id), 2000)
          const next = `/app/messages/${id}`
          router.replace(s.session.notificationsAsked ? next : `/app/onboarding/notifications?next=${encodeURIComponent(next)}`)
        }}
      >
        <Field label="What do you need?" htmlFor="text" error={errors.text} hint="The job, any make or model, and what you've tried.">
          <TextArea id="text" value={text} onChange={(e) => setText(e.target.value)} rows={5} aria-invalid={!!errors.text} autoFocus placeholder="e.g. Our boiler is making a banging noise and the radiators are only warm." />
        </Field>
        <div>
          <p className="t-label text-navy">Photos <span className="font-normal text-muted-ink">(up to 5)</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((p) => (
              <span key={p} className="relative inline-flex size-16 items-center justify-center rounded-xl bg-blue-tint t-caption text-blue">
                {p.replace(".jpg", "")}
                <button type="button" aria-label={`Remove ${p}`} onClick={() => setPhotos((x) => x.filter((y) => y !== p))} className="absolute -right-1.5 -top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-navy text-white">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => setPhotos((x) => [...x, `photo-${x.length + 1}.jpg`])} className="inline-flex size-16 flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-line t-caption text-slate hover:border-blue" aria-label="Add a photo">
                <ImagePlus className="size-5" aria-hidden /> Add
              </button>
            )}
          </div>
        </div>
        <Field label="Postcode" htmlFor="pc" error={errors.postcode}>
          <TextInput id="pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="uppercase" autoComplete="postal-code" aria-invalid={!!errors.postcode} />
        </Field>
        <fieldset>
          <legend className="t-label text-navy">When?</legend>
          <div className="mt-2 flex gap-2">
            {WHEN.map((w) => (
              <Chip key={w} active={when === w} onClick={() => setWhen(w)}>
                {w}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Button block type="submit">
          Send
        </Button>
      </form>
    </AppScreen>
  )
}

const E = withSuspense(Enquiry)
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <E slug={slug} />
}
