"use client"
import * as React from "react"
import { ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Field, TextInput } from "@/components/answerd/Fields"
import { SegmentedControl } from "@/components/answerd/Status"
import { ListingAvatar } from "@/components/answerd/Media"
import { CategoryPicker, isUkPostcode, normaliseUkPhone } from "@/components/biz/profile/fields"
import { nameSimilarity, sourceHint } from "@/components/app/claim"
import { useStore } from "@/lib/store"
import { findCompany } from "@/lib/companiesHouse"
import { districtOf, lookupPostcode, normalisePostcode } from "@/lib/geo"
import type { Business, Listing } from "@/lib/types"

type Legal = Business["legalType"]

/** Listings that look like the one being added: similar name in the same district, or the same phone number. */
export function findDuplicates(listings: Listing[], name: string, postcode: string, phone: string) {
  const district = lookupPostcode(postcode)?.district ?? districtOf(postcode)
  const digits = phone.replace(/\D/g, "")
  return listings
    .filter((l) => !l.mergedInto)
    .map((l) => ({ l, sim: l.name.toLowerCase() === name.trim().toLowerCase() ? 1 : nameSimilarity(name, l.name) }))
    .filter(({ l, sim }) => (sim >= 0.5 && (l.postcodeDistrict === district || sim >= 0.99)) || (digits.length > 9 && l.phonePublic.replace(/\D/g, "") === digits))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 4)
    .map((x) => x.l)
}

/**
 * B-03 body: business name, category (searchable), phone, postcode or service area, legal type
 * (Companies House number if Ltd). Runs the duplicate check before creating anything.
 */
export function AddBusinessForm({ initialName = "", initialPostcode = "", onPickExisting, onCreated }: { initialName?: string; initialPostcode?: string; onPickExisting: (listingId: string) => void; onCreated: (listingId: string) => void }) {
  const s = useStore()
  const [name, setName] = React.useState(initialName)
  const [cats, setCats] = React.useState<string[]>([])
  const [phone, setPhone] = React.useState("")
  const [postcode, setPostcode] = React.useState(initialPostcode)
  const [legal, setLegal] = React.useState<Legal>("sole_trader")
  const [company, setCompany] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [dupes, setDupes] = React.useState<Listing[] | null>(null)
  const found = legal === "ltd" && company.trim().length >= 8 ? findCompany(company) : undefined

  const create = () => {
    const tidyPhone = normaliseUkPhone(phone)!
    const id = s.createListing({ name: name.trim(), categoryId: cats[0]!, phone: tidyPhone, postcode: normalisePostcode(postcode), legalType: legal, companyNumber: legal === "ltd" ? company.trim() : undefined })
    const claimId = s.claimListing(id, "sms")
    s.setClaimDetails(claimId, { legalType: legal, companyNumber: legal === "ltd" ? company.trim() : undefined })
    onCreated(id)
  }

  if (dupes) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="t-title">Is it one of these?</h1>
          <p className="mt-1 t-body text-slate">We found {dupes.length === 1 ? "a business" : "businesses"} like {name.trim()}. Claiming an existing listing keeps its history.</p>
        </div>
        <ul className="space-y-2">
          {dupes.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onPickExisting(l.id)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left hover:border-blue">
                <ListingAvatar listing={l} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate t-label text-navy">{l.name}</span>
                  <span className="block truncate t-caption text-muted-ink">
                    {l.address}, {l.postcode}
                  </span>
                  <span className="block t-caption text-muted-ink">{l.businessId ? "Already on Answerd" : sourceHint(l)}</span>
                </span>
                <ChevronRight className="size-5 text-muted-ink" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <Button block onClick={create}>
          <Plus /> None of these. Add mine
        </Button>
        <Button block variant="ghost" onClick={() => setDupes(null)}>
          Edit details
        </Button>
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const errs: Record<string, string> = {}
        if (name.trim().length < 2) errs.name = "Enter your business name"
        if (!cats.length) errs.cats = "Choose what you do"
        if (!normaliseUkPhone(phone)) errs.phone = "Enter a UK phone number, like 07700 900123"
        if (!isUkPostcode(postcode)) errs.postcode = "Enter a postcode like SE25 4AA, or a district like SE25"
        if (legal === "ltd" && !/^([A-Z]{2}\d{6}|\d{8})$/i.test(company.trim())) errs.company = "Enter the 8-character Companies House number"
        setErrors(errs)
        if (Object.keys(errs).length) return
        const d = findDuplicates(s.listings, name, postcode, phone)
        if (d.length) setDupes(d)
        else create()
      }}
    >
      <div>
        <h1 className="t-title">Add your business</h1>
        <p className="mt-1 t-body text-slate">It&apos;s free. Customers can find, call and message you as soon as you&apos;re verified.</p>
      </div>
      <Field label="Business name" htmlFor="ab-name" error={errors.name}>
        <TextInput id="ab-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ade's Gardening" aria-invalid={!!errors.name} autoComplete="organization" />
      </Field>
      <Field label="What do you do?" htmlFor="ab-cat" error={errors.cats} hint="Choose your main category. You can add two more later.">
        <CategoryPicker id="ab-cat" value={cats} onChange={setCats} max={1} invalid={!!errors.cats} />
      </Field>
      <Field label="Business phone" htmlFor="ab-phone" error={errors.phone} hint="The number customers call. We'll verify it next.">
        <TextInput id="ab-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900123" className="tnum" aria-invalid={!!errors.phone} autoComplete="tel" />
      </Field>
      <Field label="Postcode or service area" htmlFor="ab-pc" error={errors.postcode} hint="Your base. Working from home? A district like SE25 is fine.">
        <TextInput id="ab-pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SE25 4AA" className="uppercase" aria-invalid={!!errors.postcode} autoComplete="postal-code" />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="t-label text-navy" id="ab-legal">
          Business type
        </span>
        <SegmentedControl
          label="Business type"
          value={legal}
          onChange={setLegal}
          options={[
            { value: "sole_trader", label: "Sole trader" },
            { value: "partnership", label: "Partnership" },
            { value: "ltd", label: "Limited" },
          ]}
        />
      </div>
      {legal === "ltd" && (
        <Field label="Companies House number" htmlFor="ab-co" error={errors.company} hint={found ? undefined : "8 characters, e.g. 09876543"}>
          <TextInput id="ab-co" value={company} onChange={(e) => setCompany(e.target.value.toUpperCase())} placeholder="09876543" className="tnum" maxLength={8} aria-invalid={!!errors.company} />
        </Field>
      )}
      {found && (
        <Banner tone="success" title={`Found: ${found.name}`}>
          {found.status === "active" ? "Active company. You can verify as a director in the next step." : "This company is dissolved."}
        </Banner>
      )}
      <Button block type="submit">
        Continue
      </Button>
    </form>
  )
}
