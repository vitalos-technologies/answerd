"use client"
import * as React from "react"
import { Field, TextArea, TextInput } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { parts } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { Business, Listing } from "@/lib/types"
import { CategoryPicker, FormSkeleton, SaveBar, isEmail, isWebsite, normaliseUkPhone, useBizRecord } from "./fields"

export interface EditorProps {
  businessId: string
  /** Called after a successful save (the store is already updated and a toast shown). */
  onSaved?: () => void
  className?: string
}

/** B-10: name, trading name, description (500 chars), categories (up to 3), phone, email, website, socials, year founded. */
export function DetailsForm(props: EditorProps) {
  const { hydrated, biz, listing } = useBizRecord(props.businessId)
  if (!hydrated || !biz || !listing) return <FormSkeleton rows={6} />
  return <DetailsInner key={biz.id} biz={biz} listing={listing} {...props} />
}

function DetailsInner({ biz, listing, onSaved, className }: EditorProps & { biz: Business; listing: Listing }) {
  const updateBusiness = useStore((s) => s.updateBusiness)
  const clock = useStore((s) => s.clock)
  const [name, setName] = React.useState(listing.name)
  const [trading, setTrading] = React.useState(biz.tradingName === listing.name ? "" : biz.tradingName)
  const [description, setDescription] = React.useState(biz.description || listing.description)
  const [cats, setCats] = React.useState<string[]>(listing.categoryIds)
  const [phone, setPhone] = React.useState(listing.phonePublic)
  const [email, setEmail] = React.useState(biz.email)
  const [website, setWebsite] = React.useState(biz.website)
  const [socials, setSocials] = React.useState(biz.socials)
  const [year, setYear] = React.useState(biz.yearFounded ? String(biz.yearFounded) : "")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const thisYear = parts(clock).y

  return (
    <form
      className={className ?? "space-y-5 px-4 pt-5"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const errs: Record<string, string> = {}
        if (name.trim().length < 2) errs.name = "Enter your business name"
        if (description.length > 500) errs.description = "Keep it to 500 characters"
        if (!cats.length) errs.cats = "Choose at least one category"
        const tidyPhone = normaliseUkPhone(phone)
        if (!tidyPhone) errs.phone = "Enter a UK phone number, like 020 7946 0123"
        if (email.trim() && !isEmail(email)) errs.email = "Enter an email like hello@yourbusiness.co.uk"
        if (website.trim() && !isWebsite(website)) errs.website = "Enter a web address like yourbusiness.co.uk"
        const y = Number(year)
        if (year.trim() && (!Number.isInteger(y) || y < 1850 || y > thisYear)) errs.year = `Enter a year between 1850 and ${thisYear}`
        setErrors(errs)
        if (Object.keys(errs).length) {
          toast("Check the highlighted fields")
          return
        }
        updateBusiness(biz.id, {
          name: name.trim(),
          tradingName: trading.trim() || name.trim(),
          description: description.trim(),
          categoryIds: cats,
          phonePublic: tidyPhone!,
          email: email.trim(),
          website: website.trim(),
          socials: socials.trim(),
          yearFounded: year.trim() ? y : undefined,
        })
        toast("Business details saved")
        onSaved?.()
      }}
    >
      <Field label="Business name" htmlFor="bd-name" error={errors.name} hint="As customers see it on Answerd">
        <TextInput id="bd-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} autoComplete="organization" />
      </Field>
      <Field label="Trading name" htmlFor="bd-trading" optional hint="If you trade under a different name">
        <TextInput id="bd-trading" value={trading} onChange={(e) => setTrading(e.target.value)} />
      </Field>
      <Field label="Description" htmlFor="bd-desc" error={errors.description} hint={`${description.length} of 500 characters`}>
        <TextArea id="bd-desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} placeholder="What you do, where, and why customers pick you" aria-invalid={!!errors.description} />
      </Field>
      <Field label="Categories" htmlFor="bd-cats" error={errors.cats} hint="Up to 3. The first is your main category.">
        <CategoryPicker id="bd-cats" value={cats} onChange={setCats} max={3} invalid={!!errors.cats} />
      </Field>
      <Field label="Phone shown to customers" htmlFor="bd-phone" error={errors.phone} hint="Calls come through an Answerd tracked number that rings this one">
        <TextInput id="bd-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="tnum" aria-invalid={!!errors.phone} autoComplete="tel" />
      </Field>
      <Field label="Email" htmlFor="bd-email" optional error={errors.email}>
        <TextInput id="bd-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} autoComplete="email" />
      </Field>
      <Field label="Website" htmlFor="bd-web" optional error={errors.website}>
        <TextInput id="bd-web" type="url" inputMode="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourbusiness.co.uk" aria-invalid={!!errors.website} />
      </Field>
      <Field label="Social links" htmlFor="bd-social" optional hint="Instagram, Facebook or TikTok handles">
        <TextInput id="bd-social" value={socials} onChange={(e) => setSocials(e.target.value)} placeholder="@yourbusiness" />
      </Field>
      <Field label="Year founded" htmlFor="bd-year" optional error={errors.year}>
        <TextInput id="bd-year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2014" className="w-32 tnum" aria-invalid={!!errors.year} />
      </Field>
      <SaveBar />
    </form>
  )
}
