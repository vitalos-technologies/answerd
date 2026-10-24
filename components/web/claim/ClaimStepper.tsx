"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Building2, CheckCircle2, ChevronRight, Clock, FileText, LayoutDashboard, MessageSquare, Phone, PhoneCall, Plus, Search, ShieldAlert, Smartphone, UserCheck } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Field, SelectInput, TextArea, TextInput, inputCls } from "@/components/answerd/Fields"
import { ListingAvatar } from "@/components/answerd/Media"
import { Rating } from "@/components/answerd/Rating"
import { BadgeRow } from "@/components/answerd/Badges"
import { Stepper } from "@/components/answerd/Status"
import { OTPInput, ResendTimer } from "@/components/answerd/OTPInput"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { claimState, enquiriesThisMonth, nameSimilarity, sourceHint } from "@/components/app/claim"
import { useStore } from "@/lib/store"
import { listingById, listingBySlug, listingRating } from "@/lib/selectors"
import { CATEGORY_GROUPS, LEAF_CATEGORIES } from "@/lib/categories"
import { districtOf, lookupPostcode } from "@/lib/geo"
import { findCompany } from "@/lib/companiesHouse"
import { isLandline, maskPhone, normaliseUkMobile } from "@/lib/format"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Business, Claim, Listing } from "@/lib/types"

type Step = "find" | "add" | "confirm" | "verify" | "code" | "director" | "document" | "done"
type Method = Claim["method"]

const STEP_INDEX: Record<Step, number> = { find: 0, add: 0, confirm: 1, verify: 2, code: 2, director: 2, document: 2, done: 3 }
const STEP_IDS: Record<Step, string> = { find: "B-01", add: "B-03", confirm: "B-02", verify: "B-04", code: "B-05", director: "B-06", document: "B-07", done: "B-08" }
const DOC_KINDS = ["Utility bill", "Bank letter", "Insurance schedule", "HMRC letter"]
const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

function isLtd(l: Listing, added?: { legalType: Business["legalType"] }) {
  return added?.legalType === "ltd" || /\b(ltd|limited)\b/i.test(l.name) || !!findCompany(l.name)
}

/** W-11: desktop version of B-01 to B-08 in a centred card stepper, using the same store actions. */
function ClaimInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const s = useStore()
  const preset = sp.get("listing")
  const presetListing = preset ? (listingBySlug(s, preset) ?? listingById(s, preset)) : undefined
  const [step, setStep] = React.useState<Step | null>(null)
  const [listingId, setListingId] = React.useState<string | null>(null)
  const [claimId, setClaimId] = React.useState<string | null>(null)
  const [method, setMethod] = React.useState<Method | null>(null)
  const [added, setAdded] = React.useState<{ legalType: Business["legalType"]; companyNumber?: string } | undefined>()
  const [result, setResult] = React.useState<{ pending: boolean; businessId?: string } | null>(null)
  const [dispute, setDispute] = React.useState<Listing | null>(null)
  const [history, setHistory] = React.useState<Step[]>([])

  // A ?listing= link (W-07 "Claim it free") starts at "Is this you?" when the listing is free.
  const presetFree = presetListing && claimState(s, presetListing) === "free"
  const current: Step = step ?? (presetFree ? "confirm" : "find")
  const listing = listingById(s, listingId ?? presetListing?.id)

  const go = (next: Step) => {
    setHistory((h) => [...h, current])
    setStep(next)
  }
  const back = () => {
    setStep(history.at(-1) ?? "find")
    setHistory((h) => h.slice(0, -1))
  }

  if (!s.hydrated) return <Frame step="find"><p className="t-body text-slate" aria-busy="true">Loading…</p></Frame>

  if (!s.session.userId) {
    const next = `/claim${preset ? `?listing=${encodeURIComponent(preset)}` : ""}`
    return (
      <Frame step={current}>
        <div className="text-center">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-blue-tint text-blue">
            <UserCheck className="size-7" aria-hidden />
          </span>
          <h1 className="t-title mt-4">{presetListing ? `Claim ${presetListing.name}` : "List or claim your business"}</h1>
          <p className="mt-2 t-body text-slate">It&apos;s free. First, sign in or create your Answerd account. It&apos;s the same account you&apos;ll use in the app.</p>
          <ButtonLink href={`/sign-in?next=${encodeURIComponent(next)}`} className="mt-6">
            Sign in or create an account
          </ButtonLink>
        </div>
      </Frame>
    )
  }

  const pick = (l: Listing) => {
    setListingId(l.id)
    go("confirm")
  }
  const choose = (m: Method) => {
    if (!listing) return
    setClaimId(s.claimListing(listing.id, m))
    setMethod(m)
    go(m === "sms" || m === "call" ? "code" : m === "director" ? "director" : "document")
  }
  const finish = (r: { ok: boolean; pending?: boolean; businessId?: string; error?: string }) => {
    if (!r.ok) return r.error ?? "That didn't work. Try again."
    setResult({ pending: !!r.pending, businessId: r.businessId })
    setHistory([])
    setStep("done")
    return null
  }

  return (
    <Frame step={current} onBack={current !== "find" && current !== "done" && (history.length > 0 || current !== "confirm") ? back : undefined}>
      {current === "find" && <FindStep onPick={pick} onAdd={() => go("add")} onDispute={setDispute} />}
      {current === "add" && (
        <AddStep
          onPick={pick}
          onCreated={(id, a) => {
            setListingId(id)
            setAdded(a)
            go("verify")
          }}
        />
      )}
      {current === "confirm" && listing && <ConfirmStep listing={listing} onYes={() => (setListingId(listing.id), go("verify"))} onNo={() => (setListingId(null), setStep("find"))} />}
      {current === "verify" && listing && <VerifyStep listing={listing} ltd={isLtd(listing, added)} onChoose={choose} />}
      {current === "code" && listing && claimId && method && <CodeStep listing={listing} method={method} onSubmit={(code) => finish(s.verifyClaim(claimId, method, { code }))} />}
      {current === "director" && listing && claimId && <DirectorStep listing={listing} companyNumber={added?.companyNumber} onSubmit={(input) => finish(s.verifyClaim(claimId, "director", input))} onDocument={() => choose("document")} />}
      {current === "document" && listing && claimId && <DocumentStep onSubmit={(document, documentKind) => finish(s.verifyClaim(claimId, "document", { document, documentKind }))} />}
      {current === "done" && listing && result && (
        <DoneStep
          listing={listing}
          pending={result.pending}
          onDashboard={() => {
            s.setMode("business", result.businessId ?? listing.businessId)
            router.push("/dashboard")
          }}
          onApp={() => {
            s.setMode("business", result.businessId ?? listing.businessId)
            router.push("/app/biz/setup")
          }}
        />
      )}

      <DisputeDialog listing={dispute} onClose={() => setDispute(null)} />
    </Frame>
  )
}

function Frame({ step, children, onBack }: { step: Step; children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-8 max-sm:px-4 md:py-14">
      <ScreenMeta id="W-11" />
      <div className="mx-auto w-full max-w-2xl">
        <Stepper steps={["Find", "Confirm", "Verify", "Done"]} current={STEP_INDEX[step]} className="mx-auto max-w-lg" />
        <div className="card mt-6 p-6 md:p-8" data-claim-step={STEP_IDS[step]}>
          {onBack && (
            <button type="button" onClick={onBack} className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1 rounded-full px-2 t-label text-blue hover:bg-blue-tint">
              <ArrowLeft className="size-4" aria-hidden /> Back
            </button>
          )}
          {children}
        </div>
        <p className="mt-4 text-center t-caption text-muted-ink">
          Prefer your phone?{" "}
          <Link href="/app/biz/claim" className="text-blue hover:underline">
            Claim in the Answerd app
          </Link>
        </p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ B-01

function FindStep({ onPick, onAdd, onDispute }: { onPick: (l: Listing) => void; onAdd: () => void; onDispute: (l: Listing) => void }) {
  const s = useStore()
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [postcode, setPostcode] = React.useState("")
  const [searched, setSearched] = React.useState(false)
  const district = postcode.trim() ? (lookupPostcode(postcode)?.district ?? districtOf(postcode)) : null
  const results = searched
    ? s.listings
        .filter((l) => !l.mergedInto)
        .map((l) => ({ l, score: (name.trim() ? (l.name.toLowerCase().includes(name.trim().toLowerCase()) ? 1 : nameSimilarity(name, l.name)) : 0.5) + (district && l.postcodeDistrict === district ? 0.5 : 0) }))
        .filter((x) => x.score >= (name.trim() ? 0.5 : 1) && (!district || x.l.postcodeDistrict === district || x.score >= 1))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((x) => x.l)
    : []
  return (
    <>
      <h1 className="t-title">Let&apos;s find your business</h1>
      <p className="mt-1 t-body text-slate">Many businesses are already on Answerd from public records. Claim yours for free.</p>
      <form
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          setSearched(true)
        }}
      >
        <Field label="Business name" htmlFor="cf-name">
          <TextInput id="cf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Norwood Locksmiths" autoFocus />
        </Field>
        <Field label="Postcode" htmlFor="cf-pc" optional>
          <TextInput id="cf-pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SE25 4AA" className="uppercase" />
        </Field>
        <Button type="submit" disabled={!name.trim() && !postcode.trim()}>
          <Search /> Search
        </Button>
      </form>
      {searched && (
        <section className="mt-6" aria-labelledby="cf-res">
          <h2 id="cf-res" className="t-subhead">
            {results.length ? `${results.length} possible match${results.length > 1 ? "es" : ""}` : "No matches"}
          </h2>
          {results.length ? (
            <ul className="mt-3 space-y-2">
              {results.map((l) => {
                const st = claimState(s, l)
                return (
                  <li key={l.id}>
                    {st === "taken" ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
                        <ListingAvatar initials={l.initials} hue={l.hue} size={44} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate t-label text-navy">{l.name}</p>
                          <p className="truncate t-caption text-muted-ink">{l.address}</p>
                          <p className="mt-0.5 inline-flex items-center gap-1 t-caption text-amber-ink">
                            <ShieldAlert className="size-3.5" aria-hidden /> Already claimed
                          </p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => onDispute(l)}>
                          Dispute this claim
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (st === "mine") {
                            s.setMode("business", l.businessId)
                            router.push("/dashboard")
                          } else onPick(l)
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left hover:border-blue"
                      >
                        <ListingAvatar initials={l.initials} hue={l.hue} size={44} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate t-label text-navy">{l.name}</span>
                          <span className="block truncate t-caption text-muted-ink">
                            {l.address}, {l.postcode}
                          </span>
                          <span className={cn("mt-0.5 block t-caption", st === "mine" ? "text-teal-ink" : "text-muted-ink")}>{st === "mine" ? "Yours: open your dashboard" : sourceHint(l)}</span>
                        </span>
                        <ChevronRight className="size-5 text-muted-ink" aria-hidden />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState title="We couldn't find it" body="Add your business and it'll be live in a few minutes." className="py-6" />
          )}
        </section>
      )}
      <button type="button" onClick={onAdd} className="mt-6 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-sky px-4 text-left hover:bg-blue-tint">
        <Plus className="size-5 text-blue" aria-hidden />
        <span className="flex-1">
          <span className="block t-label text-navy">Can&apos;t see it? Add your business</span>
          <span className="block t-caption text-muted-ink">Takes about two minutes</span>
        </span>
      </button>
    </>
  )
}

// ------------------------------------------------------------------ B-03

function AddStep({ onCreated, onPick }: { onCreated: (id: string, a: { legalType: Business["legalType"]; companyNumber?: string }) => void; onPick: (l: Listing) => void }) {
  const s = useStore()
  const [name, setName] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [postcode, setPostcode] = React.useState("")
  const [legalType, setLegalType] = React.useState<Business["legalType"]>("sole_trader")
  const [companyNumber, setCompanyNumber] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [dupes, setDupes] = React.useState<Listing[] | null>(null)

  const create = () => {
    const pc = lookupPostcode(postcode)
    const id = s.createListing({ name: name.trim(), categoryId, phone: normaliseUkMobile(phone) ?? phone.trim(), postcode: pc?.postcode ?? postcode.trim().toUpperCase(), legalType, companyNumber: legalType === "ltd" ? companyNumber.trim() : undefined })
    toast(`${name.trim()} added`)
    onCreated(id, { legalType, companyNumber: legalType === "ltd" ? companyNumber.trim() : undefined })
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (name.trim().length < 2) errs.name = "Enter your business name"
    if (!categoryId) errs.category = "Choose what you do"
    if (!/^0\d{9,10}$/.test(phone.replace(/\s/g, ""))) errs.phone = "Enter a UK phone number customers can call"
    if (!lookupPostcode(postcode)) errs.postcode = "We don't recognise that postcode"
    if (legalType === "ltd" && !/^\d{8}$/.test(companyNumber.trim())) errs.company = "Companies House numbers have 8 digits"
    setErrors(errs)
    if (Object.keys(errs).length) return
    const district = lookupPostcode(postcode)!.district
    const found = s.listings.filter((l) => !l.mergedInto && l.postcodeDistrict === district && nameSimilarity(name, l.name) >= 0.6)
    if (found.length && dupes === null) {
      setDupes(found)
      return
    }
    create()
  }

  if (dupes && dupes.length) {
    return (
      <>
        <h1 className="t-title">Is it one of these?</h1>
        <p className="mt-1 t-body text-slate">We found listings that look like yours. Claiming an existing one keeps its reviews and enquiries.</p>
        <ul className="mt-5 space-y-2">
          {dupes.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onPick(l)} className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left hover:border-blue">
                <ListingAvatar initials={l.initials} hue={l.hue} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate t-label text-navy">{l.name}</span>
                  <span className="block truncate t-caption text-muted-ink">
                    {l.address}, {l.postcode}
                  </span>
                </span>
                <ChevronRight className="size-5 text-muted-ink" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-5" onClick={create}>
          No, add {name.trim()} as new
        </Button>
      </>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="t-title">Add your business</h1>
      <p className="mt-1 t-body text-slate">It&apos;s free. You can add services, prices and photos once you&apos;re verified.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Business name" htmlFor="ad-name" error={errors.name} className="sm:col-span-2">
          <TextInput id="ad-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} autoFocus />
        </Field>
        <Field label="What do you do?" htmlFor="ad-cat" error={errors.category}>
          <SelectInput id="ad-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-invalid={!!errors.category}>
            <option value="">Choose a category</option>
            {CATEGORY_GROUPS.map((g) => (
              <optgroup key={g.id} label={g.name}>
                {LEAF_CATEGORIES.filter((c) => c.parentId === g.id).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </SelectInput>
        </Field>
        <Field label="Phone customers call" htmlFor="ad-phone" error={errors.phone}>
          <TextInput id="ad-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900123" aria-invalid={!!errors.phone} className="tnum" />
        </Field>
        <Field label="Postcode" htmlFor="ad-pc" error={errors.postcode} hint="Where you're based">
          <TextInput id="ad-pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SE25 4AA" className="uppercase" aria-invalid={!!errors.postcode} />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="t-label text-navy">Business type</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Business type">
            {(
              [
                ["sole_trader", "Sole trader"],
                ["partnership", "Partnership"],
                ["ltd", "Limited company"],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={legalType === v} onClick={() => setLegalType(v)} className={cn("flex min-h-12 items-center justify-center rounded-xl border px-3 t-label", legalType === v ? "border-blue bg-blue-tint text-navy" : "border-line text-navy hover:border-blue/50")}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        {legalType === "ltd" && (
          <Field label="Companies House number" htmlFor="ad-co" error={errors.company} hint="8 digits, e.g. 12345678">
            <TextInput id="ad-co" inputMode="numeric" value={companyNumber} onChange={(e) => setCompanyNumber(e.target.value)} aria-invalid={!!errors.company} className="tnum" />
          </Field>
        )}
      </div>
      <Button type="submit" className="mt-6">
        Continue
      </Button>
    </form>
  )
}

// ------------------------------------------------------------------ B-02

function ConfirmStep({ listing, onYes, onNo }: { listing: Listing; onYes: () => void; onNo: () => void }) {
  const s = useStore()
  const cat = s.categories.find((c) => c.id === listing.categoryIds[0])
  const r = listingRating(s, listing)
  const tried = enquiriesThisMonth(s, listing.id).length
  return (
    <>
      <h1 className="t-title">Is this you?</h1>
      <p className="mt-1 t-body text-slate">This is how customers see your listing today.</p>
      <div className="mt-5 rounded-2xl border border-line p-4">
        <div className="flex items-start gap-3">
          <ListingAvatar initials={listing.initials} hue={listing.hue} size={56} />
          <div className="min-w-0">
            <p className="t-subhead">{listing.name}</p>
            <p className="t-caption text-muted-ink">
              {cat?.name} · {listing.address}, {listing.postcode}
            </p>
            <Rating value={r.rating} count={r.count} google={r.google} className="mt-1" />
            <BadgeRow kinds={["unclaimed"]} className="mt-2" />
          </div>
        </div>
      </div>
      {tried > 0 && (
        <Banner tone="info" className="mt-4" title={`${tried} ${tried === 1 ? "person" : "people"} tried to reach you this month`} icon={<MessageSquare className="size-5 text-blue" aria-hidden />}>
          Claim it to see who called and messaged, and reply.
        </Banner>
      )}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onYes}>Yes, claim it</Button>
        <Button variant="secondary" onClick={onNo}>
          Not mine
        </Button>
      </div>
    </>
  )
}

// ------------------------------------------------------------------ B-04

function VerifyStep({ listing, ltd, onChoose }: { listing: Listing; ltd: boolean; onChoose: (m: Method) => void }) {
  const landline = isLandline(listing.phonePublic)
  const masked = maskPhone(listing.phonePublic)
  const options: { m: Method; icon: typeof Phone; title: string; body: string; show: boolean }[] = [
    { m: "sms", icon: Smartphone, title: `Text a code to ${masked}`, body: "The number on your listing. Fastest.", show: !landline },
    { m: "call", icon: PhoneCall, title: `Call me with a code on ${masked}`, body: "We'll ring the listed number and read out a code.", show: true },
    { m: "director", icon: Building2, title: "Confirm as a company director", body: "Matched against Companies House officers.", show: ltd },
    { m: "document", icon: FileText, title: "Upload a document", body: "Utility bill, bank letter, insurance schedule or HMRC letter. Checked within 1 working day.", show: true },
  ]
  return (
    <>
      <h1 className="t-title">Verify you own {listing.name}</h1>
      <p className="mt-1 t-body text-slate">Choose how you&apos;d like to prove it.</p>
      {landline && <p className="mt-3 t-caption text-muted-ink">The listed number is a landline, so we can&apos;t text it. We can call it instead.</p>}
      <ul className="mt-5 space-y-2">
        {options
          .filter((o) => o.show)
          .map((o) => (
            <li key={o.m}>
              <button type="button" onClick={() => onChoose(o.m)} className="flex w-full items-center gap-3 rounded-2xl border border-line p-4 text-left hover:border-blue">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue">
                  <o.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block t-label text-navy tnum">{o.title}</span>
                  <span className="block t-caption text-muted-ink">{o.body}</span>
                </span>
                <ChevronRight className="size-5 text-muted-ink" aria-hidden />
              </button>
            </li>
          ))}
      </ul>
    </>
  )
}

// ------------------------------------------------------------------ B-05

function CodeStep({ listing, method, onSubmit }: { listing: Listing; method: Method; onSubmit: (code: string) => string | null }) {
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState("")
  const [key, setKey] = React.useState(0)
  const submit = (v: string) => {
    const err = onSubmit(v)
    if (err) {
      setError(err)
      setCode("")
      setKey((k) => k + 1)
    }
  }
  return (
    <>
      <h1 className="t-title">Enter the code</h1>
      <p className="mt-1 t-body text-slate">
        {method === "sms" ? "We texted a 6-digit code to " : "We're calling "}
        <span className="font-semibold text-navy tnum">{maskPhone(listing.phonePublic)}</span>
        {method === "call" ? " now with a 6-digit code." : "."}
      </p>
      {error && <Banner tone="error" className="mt-4" title={error}>Check the code and try again.</Banner>}
      <div className="mt-6 max-w-sm" key={key}>
        <OTPInput value={code} onChange={setCode} onComplete={submit} error={!!error} />
      </div>
      <div className="mt-5">
        <ResendTimer onResend={() => toast(method === "sms" ? "New code sent" : "Calling again")} />
      </div>
      <p className="mt-6 t-caption text-muted-ink">Prototype: any 6 digits work. 000000 is always wrong.</p>
    </>
  )
}

// ------------------------------------------------------------------ B-06

function DirectorStep({ listing, companyNumber, onSubmit, onDocument }: { listing: Listing; companyNumber?: string; onSubmit: (input: { directorName: string; dob: string; companyNumber?: string }) => string | null; onDocument: () => void }) {
  const company = findCompany(companyNumber || listing.name)
  const [fullName, setFullName] = React.useState("")
  const [month, setMonth] = React.useState("")
  const [year, setYear] = React.useState("")
  const [error, setError] = React.useState("")
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!fullName.trim() || !month || !/^\d{4}$/.test(year)) return setError("Enter your full name and month and year of birth")
        const err = onSubmit({ directorName: fullName.trim(), dob: `${month}/${year}`, companyNumber: company?.number ?? companyNumber })
        if (err) setError(err)
      }}
    >
      <h1 className="t-title">Confirm you&apos;re a director</h1>
      <p className="mt-1 t-body text-slate">We&apos;ll match you against the officers Companies House lists{company ? ` for ${company.name} (${company.number})` : ""}.</p>
      {error && (
        <Banner tone="error" className="mt-4" title={error} action={<Button size="sm" variant="secondary" onClick={onDocument}>Upload a document instead</Button>} />
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_120px_120px]">
        <Field label="Full name" htmlFor="dir-name">
          <TextInput id="dir-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Birth month" htmlFor="dir-month">
          <SelectInput id="dir-month" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Birth year" htmlFor="dir-year">
          <TextInput id="dir-year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="1985" className="tnum" />
        </Field>
      </div>
      {company && (
        <p className="mt-3 t-caption text-muted-ink">
          Prototype: {company.officers.filter((o) => o.role === "director").map((o) => `${o.name}, born ${o.born}`).join("; ")}.
        </p>
      )}
      <Button type="submit" className="mt-6">
        Check with Companies House
      </Button>
    </form>
  )
}

// ------------------------------------------------------------------ B-07

function DocumentStep({ onSubmit }: { onSubmit: (file: string, kind: string) => string | null }) {
  const [kind, setKind] = React.useState(DOC_KINDS[0]!)
  const [file, setFile] = React.useState("")
  const [error, setError] = React.useState("")
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!file) return setError("Choose a file or photo of the document")
        const err = onSubmit(file, kind)
        if (err) setError(err)
      }}
    >
      <h1 className="t-title">Upload a document</h1>
      <p className="mt-1 t-body text-slate">It must show the business name and address. We&apos;ll check it within 1 working day.</p>
      {error && <Banner tone="error" className="mt-4" title={error} />}
      <div className="mt-6 grid gap-4">
        <Field label="Document type" htmlFor="doc-kind">
          <SelectInput id="doc-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {DOC_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="File or photo" htmlFor="doc-file" hint="PDF, JPG or PNG">
          <input id="doc-file" type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} className={cn(inputCls, "py-2.5 file:mr-3 file:rounded-full file:border-0 file:bg-blue-tint file:px-3 file:py-1 file:t-label file:text-blue")} />
        </Field>
        <button type="button" onClick={() => setFile(`${kind.toLowerCase().replace(/\s+/g, "-")}.pdf`)} className="inline-flex min-h-11 items-center self-start t-label text-blue hover:underline">
          Prototype: use a sample {kind.toLowerCase()}
        </button>
        {file && <p className="t-caption text-muted-ink">Selected: {file}</p>}
      </div>
      <Button type="submit" className="mt-6">
        Submit for checking
      </Button>
    </form>
  )
}

// ------------------------------------------------------------------ B-08

function DoneStep({ listing, pending, onDashboard, onApp }: { listing: Listing; pending: boolean; onDashboard: () => void; onApp: () => void }) {
  const s = useStore()
  const month = s.clock.slice(0, 7)
  const since = s.enquiries.filter((e) => e.listingId === listing.id && e.at.slice(0, 7) === month)
  const calls = since.filter((e) => e.kind === "call").length
  const messages = since.filter((e) => e.kind === "message").length
  const bookings = since.filter((e) => e.kind === "booking").length
  const first = new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  return (
    <div className="text-center">
      <span className={cn("mx-auto inline-flex size-16 items-center justify-center rounded-full", pending ? "bg-amber-tint text-amber-ink" : "bg-teal-tint text-teal-ink")}>
        {pending ? <Clock className="size-8" aria-hidden /> : <CheckCircle2 className="size-9" aria-hidden />}
      </span>
      <h1 className="t-title mt-4">{pending ? "Verification pending" : `${listing.name} is yours`}</h1>
      <p className="mt-2 t-body text-slate">{pending ? "We'll check your document within 1 working day. You can set up your profile while you wait; it goes live once you're verified." : "You're verified. Set up your profile so customers can message and book you."}</p>
      <div className="mt-6 rounded-2xl bg-sky p-4 text-left">
        <p className="t-caption text-muted-ink">Enquiry history</p>
        <p className="t-subhead tnum">
          {calls || messages || bookings
            ? `${calls} ${calls === 1 ? "call" : "calls"} and ${messages} ${messages === 1 ? "message" : "messages"}${bookings ? ` and ${bookings} ${bookings === 1 ? "booking" : "bookings"}` : ""} from Answerd since ${first}`
            : "No enquiries yet. Every call and message from Answerd will show here."}
        </p>
      </div>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button onClick={onDashboard}>
          <LayoutDashboard /> Go to dashboard
        </Button>
        <Button variant="secondary" onClick={onApp}>
          <Smartphone /> Open in the app
        </Button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ dispute

function DisputeDialog({ listing, onClose }: { listing: Listing | null; onClose: () => void }) {
  const s = useStore()
  const [details, setDetails] = React.useState("")
  const [evidence, setEvidence] = React.useState("")
  return (
    <Dialog open={!!listing} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-0 bg-white p-6 shadow-overlay sm:max-w-md">
        <DialogTitle className="t-heading">Dispute this claim</DialogTitle>
        <DialogDescription className="t-body text-slate">Someone has already claimed {listing?.name}. Tell us why it&apos;s yours and our team will check within 1 working day.</DialogDescription>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!listing || details.trim().length < 10) return toast("Add a few details so we can check")
            s.disputeClaim(listing.id, details.trim(), evidence || "no-file")
            toast("Dispute sent. We'll be in touch.")
            setDetails("")
            setEvidence("")
            onClose()
          }}
        >
          <Field label="Why is it yours?" htmlFor="dd-web">
            <TextArea id="dd-web" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. I'm the director; the previous claim was a former employee" />
          </Field>
          <Field label="Supporting document" htmlFor="ev-web" optional hint="Utility bill, lease or HMRC letter in the business name">
            <input id="ev-web" type="file" onChange={(e) => setEvidence(e.target.files?.[0]?.name ?? "")} className={cn(inputCls, "py-2.5 file:mr-3 file:rounded-full file:border-0 file:bg-blue-tint file:px-3 file:py-1 file:t-label file:text-blue")} />
          </Field>
          <Button block type="submit">
            Send dispute
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ClaimStepper() {
  return (
    <React.Suspense fallback={null}>
      <ClaimInner />
    </React.Suspense>
  )
}
