"use client"
import * as React from "react"
import { Building2 } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Field, TextInput } from "@/components/answerd/Fields"
import { Select } from "@/components/biz/profile/fields"
import { useStore } from "@/lib/store"
import { findCompany } from "@/lib/companiesHouse"
import { parts } from "@/lib/time"
import { companyFor, ensureClaim } from "./helpers"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

/** B-06 body: director full name and month and year of birth, matched against Companies House officers (mock). */
export function DirectorCheck({ listingId, onVerified, onNoMatch }: { listingId: string; onVerified: (businessId: string) => void; onNoMatch: () => void }) {
  const s = useStore()
  const l = s.listings.find((x) => x.id === listingId)
  const known = l ? companyFor(s, l) : undefined
  const [number, setNumber] = React.useState(known?.number ?? "")
  const [name, setName] = React.useState("")
  const [month, setMonth] = React.useState("")
  const [year, setYear] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [noMatch, setNoMatch] = React.useState(false)
  if (!l) return null
  const company = known ?? (number.trim().length >= 8 ? findCompany(number) : undefined)
  const thisYear = parts(s.clock).y
  const years = Array.from({ length: 80 }, (_, i) => String(thisYear - 16 - i))

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const errs: Record<string, string> = {}
        if (!known && !/^([A-Z]{2}\d{6}|\d{8})$/i.test(number.trim())) errs.number = "Enter the 8-character Companies House number"
        if (name.trim().split(/\s+/).length < 2) errs.name = "Enter your full name as it appears at Companies House"
        if (!month || !year) errs.dob = "Choose the month and year you were born"
        setErrors(errs)
        if (Object.keys(errs).length) return
        const claimId = ensureClaim(listingId, "director")
        const res = useStore.getState().verifyClaim(claimId, "director", { directorName: name.trim(), dob: `${month}/${year}`, companyNumber: company?.number ?? number.trim() })
        if (res.ok) onVerified(res.businessId!)
        else setNoMatch(true)
      }}
    >
      <div>
        <h1 className="t-title">Director check</h1>
        <p className="mt-1 t-body text-slate">We&apos;ll match your details against the officers listed at Companies House.</p>
      </div>
      {known ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue">
            <Building2 className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block t-label text-navy">{known.name}</span>
            <span className="block t-caption text-muted-ink tnum">
              Company {known.number} · {known.status === "active" ? "Active" : "Dissolved"}
            </span>
          </span>
        </div>
      ) : (
        <Field label="Companies House number" htmlFor="dc-num" error={errors.number} hint={company ? `Found: ${company.name}` : "8 characters, e.g. 09876543"}>
          <TextInput id="dc-num" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} maxLength={8} className="tnum" aria-invalid={!!errors.number} />
        </Field>
      )}
      {noMatch && (
        <Banner tone="error" title="We couldn't match you to a director" action={<Button size="sm" variant="secondary" onClick={onNoMatch}>Upload a document instead</Button>}>
          Check your name and date of birth match Companies House, or upload a document in the business name.
        </Banner>
      )}
      <Field label="Director's full name" htmlFor="dc-name" error={errors.name}>
        <TextInput id="dc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Samuel Okafor" autoComplete="name" aria-invalid={!!errors.name} />
      </Field>
      <fieldset className="min-w-0">
        <legend className="mb-1.5 t-label text-navy">Month and year of birth</legend>
        <div className="flex gap-3">
          <Select aria-label="Month of birth" value={month} onChange={(e) => setMonth(e.target.value)} aria-invalid={!!errors.dob || undefined}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, "0")}>
                {m}
              </option>
            ))}
          </Select>
          <Select aria-label="Year of birth" value={year} onChange={(e) => setYear(e.target.value)} className="w-32" aria-invalid={!!errors.dob || undefined}>
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        {errors.dob && (
          <p className="mt-1.5 t-caption text-red" role="alert">
            {errors.dob}
          </p>
        )}
      </fieldset>
      <Button block type="submit">
        Check with Companies House
      </Button>
      <Button block variant="ghost" onClick={onNoMatch}>
        Upload a document instead
      </Button>
    </form>
  )
}
