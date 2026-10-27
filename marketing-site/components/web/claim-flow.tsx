"use client"
import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Building2, CheckCircle2, ChevronRight, Clock, FileText, MessageSquare, PhoneCall, Plus, Search, ShieldAlert, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { fill } from "@/lib/fill"
import { focusRing } from "@/components/site/focus"
import { findCompany, matchDirector } from "@/lib/data/companies-house"
import type { Claimable, Tone } from "@/lib/data/queries"
import { isLandline, maskPhone } from "@/lib/data/format"
import { apiEnabled } from "@/lib/api/client"
import { claimLookup, claimSearch, claimStart, claimVerify } from "@/lib/api/actions"
import type { ApiListingCard } from "@/lib/api/types"
import { useDemo } from "@/lib/demo-session"
import type { pages } from "@/content/pages"
import { Field, Note, PrototypeLabel, CodeInput, btnPrimary, btnSecondary, inputCls } from "./form"

type Copy = (typeof pages)["claim"]
type Step = "find" | "add" | "confirm" | "signin" | "verify" | "code" | "director" | "document" | "done"
type Method = "sms" | "call" | "director" | "document"
type Group = { id: string; name: string; leaves: { id: string; name: string }[] }

const STEP_INDEX: Record<Step, number> = { find: 0, add: 0, confirm: 1, signin: 1, verify: 2, code: 2, director: 2, document: 2, done: 3 }
const TONES: Record<Tone, string> = { blue: "bg-blue-tint text-blue-hover", teal: "bg-teal-tint text-teal-ink", amber: "bg-amber-tint text-amber-ink", sky: "bg-sky text-navy" }

function Avatar({ l, size = 44 }: { l: Pick<Claimable, "initials" | "tone">; size?: number }) {
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-xl font-bold", TONES[l.tone])} style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}>
      {l.initials}
    </span>
  )
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "ltd", "co", "services", "service"].includes(w))
    .map((w) => w.replace(/(ing|ers|er|s)$/, ""))

/** Name similarity 0..1 by shared word stems (from the prototype's claim helpers). */
function nameSimilarity(a: string, b: string) {
  const A = new Set(words(a))
  const B = new Set(words(b))
  if (!A.size || !B.size) return 0
  let shared = 0
  for (const w of A) if (B.has(w)) shared++
  return shared / Math.min(A.size, B.size)
}

const district = (postcode: string) => postcode.trim().toUpperCase().split(/\s+/)[0] ?? ""
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

function subscribeSearch() {
  return () => {}
}

const TINT: Record<string, Tone> = { "blue-tint": "blue", "teal-tint": "teal", "amber-tint": "amber", sky: "sky" }

/** API mode: a search result as the claim steps need it. */
function claimableFrom(i: ApiListingCard & { address?: string | null; postcodeDistrict?: string | null }, copy: Copy): Claimable {
  const phone = (i.phonePublic ?? "").replace(/^\+44/, "0")
  return {
    id: i.id!,
    slug: i.slug ?? "",
    name: i.name,
    initials: i.avatar?.initials ?? i.name.slice(0, 2).toUpperCase(),
    tone: TINT[i.avatar?.tint] ?? "blue",
    categoryName: i.categoryName,
    address: [i.address, i.postcodeDistrict].filter(Boolean).join(", ") || (i.distanceMiles != null ? `${i.distanceMiles.toFixed(1)} mi away` : ""),
    district: i.postcodeDistrict ?? "",
    layer: i.layer,
    masked: phone ? maskPhone(phone) : "",
    landline: phone ? isLandline(phone) : false,
    ltd: /\b(ltd|limited)\b/i.test(i.name),
    triedThisMonth: 0,
    source: i.layer === "claimed" ? copy.live.fromAnswerd : copy.live.fromRecords,
  }
}

/** API mode: verification goes to the claim endpoints. Returns an error message, or null when it worked. */
type Verify = (method: Method, body?: Record<string, unknown>) => Promise<string | null>

/**
 * W-11: claim or add a business, as a centred card stepper (desktop version of B-01 to B-08). Everything is
 * local state; nothing is sent. It ends with "Get the app to run your business", the QR code and the stores.
 */
export function ClaimFlow({ copy, listings, groups, qr, badges }: { copy: Copy; listings: Claimable[]; groups: Group[]; qr: React.ReactNode; badges: React.ReactNode }) {
  // ?listing=slug (from "Claim this business" on a listing page) starts at "Is this you?"
  const preset = React.useSyncExternalStore(
    subscribeSearch,
    () => new URLSearchParams(window.location.search).get("listing"),
    () => null,
  )
  const demo = useDemo()
  const [apiPreset, setApiPreset] = React.useState<Claimable | null>(null)
  const [claimId, setClaimId] = React.useState<string | null>(null)
  const [apiError, setApiError] = React.useState("")
  const [working, setWorking] = React.useState(false)
  React.useEffect(() => {
    if (!apiEnabled || !preset) return
    let on = true
    claimLookup(preset).then((r) => on && r.ok && r.data.id && r.data.layer !== "claimed" && setApiPreset(claimableFrom(r.data, copy)))
    return () => {
      on = false
    }
  }, [preset, copy])
  const presetListing = apiEnabled ? (apiPreset ?? undefined) : preset ? listings.find((l) => l.slug === preset && l.layer !== "claimed") : undefined
  const [step, setStep] = React.useState<Step | null>(null)
  const [history, setHistory] = React.useState<Step[]>([])
  const [listingId, setListingId] = React.useState<string | null>(null)
  const [added, setAdded] = React.useState<Claimable | null>(null)
  const [method, setMethod] = React.useState<Method | null>(null)
  const [pending, setPending] = React.useState(false)
  const current: Step = step ?? (presetListing ? "confirm" : "find")
  const [picked, setPicked] = React.useState<Claimable | null>(null)
  const wanted = listingId ?? presetListing?.id
  const listing = [added, picked, presetListing].find((x) => x && x.id === wanted) ?? listings.find((l) => l.id === wanted)
  const heading = React.useRef<HTMLDivElement>(null)
  const moved = React.useRef(false)

  // Move focus to the new step's heading so keyboard and screen reader users follow along.
  React.useEffect(() => {
    if (!moved.current) return
    heading.current?.querySelector<HTMLElement>("h1, h2")?.focus({ preventScroll: false })
  }, [current])

  const go = (next: Step) => {
    moved.current = true
    setHistory((h) => [...h, current])
    setStep(next)
  }
  const back = () => {
    moved.current = true
    setStep(history.at(-1) ?? "find")
    setHistory((h) => h.slice(0, -1))
  }
  const choose = (m: Method) => {
    setMethod(m)
    go(m === "sms" || m === "call" ? "code" : m)
  }
  const done = (isPending: boolean) => {
    setPending(isPending)
    setHistory([])
    moved.current = true
    setStep("done")
  }

  // API mode: confirming starts a claim on the signed-in account (sign in first if needed)
  const confirm = async (l: Claimable) => {
    setListingId(l.id)
    if (!apiEnabled) return go("verify")
    if (!demo?.user?.api) return go("signin")
    setWorking(true)
    const r = await claimStart(l.id)
    setWorking(false)
    if (!r.ok) return setApiError(fill(copy.live.error, { message: r.message }))
    setApiError("")
    setClaimId(r.data.id)
    go("verify")
  }
  const verify: Verify | undefined =
    apiEnabled && claimId
      ? async (m, body = {}) => {
          const r = await claimVerify(claimId, m, body)
          return r.ok ? null : fill(copy.live.error, { message: r.message })
        }
      : undefined

  const idx = STEP_INDEX[current]
  return (
    <div className="container-site py-8 md:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <ol className="flex items-center gap-2" aria-label={fill(copy.stepOf, { n: idx + 1, total: copy.steps.length, name: copy.steps[idx]! })}>
          {copy.steps.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col gap-1.5" aria-current={i === idx ? "step" : undefined}>
              <span aria-hidden className={cn("h-1.5 rounded-full", i <= idx ? "bg-blue" : "bg-line")} />
              <span className={cn("text-[13px] leading-4 font-medium", i === idx ? "text-navy" : "text-slate")}>{s}</span>
            </li>
          ))}
        </ol>
        <div className="card-site mt-6 p-6 md:p-8" ref={heading}>
          {current !== "find" && current !== "done" && (history.length > 0 || current !== "confirm") && (
            <button type="button" onClick={back} className={`-ml-2 mb-3 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-semibold text-blue hover:bg-blue-tint ${focusRing}`}>
              <ArrowLeft className="size-4" aria-hidden /> {copy.back}
            </button>
          )}
          {current === "find" && <FindStep copy={copy} listings={listings} onPick={(l) => (setPicked(l), setListingId(l.id), go("confirm"))} onAdd={() => go("add")} />}
          {current === "add" && (
            <AddStep
              copy={copy}
              groups={groups}
              listings={listings}
              onPick={(l) => (setListingId(l.id), go("confirm"))}
              onCreated={(l) => {
                setAdded(l)
                setListingId(l.id)
                go("verify")
              }}
            />
          )}
          {current === "confirm" && listing && <ConfirmStep copy={copy} l={listing} busy={working} error={apiError} onYes={() => confirm(listing)} onNo={() => (setListingId(null), (moved.current = true), setStep("find"))} />}
          {current === "signin" && listing && <SignInStep copy={copy} l={listing} />}
          {current === "verify" && listing && <VerifyStep copy={copy} l={listing} onChoose={choose} />}
          {current === "code" && listing && method && <CodeStep copy={copy} l={listing} method={method} verify={verify} onDone={() => done(false)} />}
          {current === "director" && listing && <DirectorStep copy={copy} l={listing} verify={verify} onDone={() => done(false)} onDocument={() => choose("document")} />}
          {current === "document" && <DocumentStep copy={copy} verify={verify} onDone={() => done(true)} />}
          {current === "done" && listing && <DoneStep copy={copy} l={listing} pending={pending} qr={qr} badges={badges} />}
        </div>
        {!apiEnabled && <p className="mt-4 text-center text-[14px] leading-5 text-slate">{copy.prototypeNote}</p>}
      </div>
    </div>
  )
}

function Heading({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <>
      <h1 tabIndex={-1} className="text-[26px] leading-8 font-bold tracking-[-0.01em] text-navy outline-none md:text-[30px] md:leading-9">
        {children}
      </h1>
      {sub && <p className="mt-1.5 text-slate">{sub}</p>}
    </>
  )
}

function Row({ l, children }: { l: Claimable; children?: React.ReactNode }) {
  return (
    <>
      <Avatar l={l} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-navy">{l.name}</span>
        <span className="block truncate text-[14px] leading-5 text-muted-ink">{l.address}</span>
        {children}
      </span>
    </>
  )
}

// ------------------------------------------------------------------ B-01 find

function FindStep({ copy, listings, onPick, onAdd }: { copy: Copy; listings: Claimable[]; onPick: (l: Claimable) => void; onAdd: () => void }) {
  const c = copy.find
  const [name, setName] = React.useState("")
  const [postcode, setPostcode] = React.useState("")
  const [query, setQuery] = React.useState<{ name: string; postcode: string } | null>(null)
  const [dispute, setDispute] = React.useState<string | null>(null)
  const [found, setFound] = React.useState<Claimable[] | null>(null)
  const [searching, setSearching] = React.useState(false)
  const seq = React.useRef(0)
  const apiSearch = async (q: { name: string; postcode: string }) => {
    const mine = ++seq.current
    setSearching(true)
    const r = await claimSearch(q.name.trim(), q.postcode.trim())
    if (mine !== seq.current) return
    setSearching(false)
    setFound(r.ok ? r.data.map((i) => claimableFrom(i, copy)) : [])
  }
  const local = React.useMemo(() => {
    if (!query || apiEnabled) return []
    const d = query.postcode.trim() ? district(query.postcode) : null
    const n = query.name.trim().toLowerCase()
    return listings
      .map((l) => ({ l, score: (n ? (l.name.toLowerCase().includes(n) ? 1 : nameSimilarity(n, l.name)) : 0.5) + (d && l.district === d ? 0.5 : 0) }))
      .filter((x) => x.score >= (n ? 0.5 : 1) && (!d || x.l.district === d || x.score >= 1))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.l)
  }, [query, listings])
  const results = apiEnabled ? (found ?? []) : local

  return (
    <>
      <Heading sub={c.body}>{c.heading}</Heading>
      <form
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_150px_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          setQuery({ name, postcode })
          if (apiEnabled) void apiSearch({ name, postcode })
        }}
      >
        <Field label={c.name} htmlFor="cf-name">
          <input id="cf-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={c.namePlaceholder} autoComplete="organization" />
        </Field>
        <Field label={c.postcode} htmlFor="cf-pc" optional={c.optional}>
          <input id="cf-pc" className={cn(inputCls, "uppercase placeholder:normal-case")} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SE25 4AA" autoComplete="postal-code" />
        </Field>
        <button type="submit" className={btnPrimary} disabled={!name.trim() && !postcode.trim()}>
          <Search aria-hidden /> {c.search}
        </button>
      </form>
      {query && (
        <section className="mt-6" aria-labelledby="cf-res" aria-live="polite">
          <h2 id="cf-res" className="font-semibold text-navy">
            {searching ? copy.live.searching : results.length ? (results.length === 1 ? c.matchesOne : fill(c.matchesMany, { n: results.length })) : c.none}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {results.map((l) =>
              l.layer === "claimed" ? (
                <li key={l.id} className="rounded-2xl border border-line p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Row l={l}>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[14px] leading-5 font-medium text-amber-ink">
                        <ShieldAlert className="size-3.5" aria-hidden /> {c.taken}
                      </span>
                    </Row>
                    <button type="button" onClick={() => setDispute(dispute === l.id ? null : l.id)} aria-expanded={dispute === l.id} className={cn(btnSecondary, "h-11 px-4 text-[15px]")}>
                      {c.dispute}
                    </button>
                  </div>
                  {dispute === l.id && <DisputeForm copy={copy} name={l.name} />}
                </li>
              ) : (
                <li key={l.id}>
                  <button type="button" onClick={() => onPick(l)} className={`flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left hover:border-blue ${focusRing}`}>
                    <Row l={l}>
                      <span className="mt-0.5 block text-[14px] leading-5 text-muted-ink">{l.source}</span>
                    </Row>
                    <ChevronRight className="size-5 shrink-0 text-muted-ink" aria-hidden />
                  </button>
                </li>
              ),
            )}
          </ul>
        </section>
      )}
      {apiEnabled ? (
        // API mode: adding a new business happens in the app until the web flow is wired to POST /v1/businesses
        <Link href="/get-the-app" className={`mt-6 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-sky px-4 py-3 text-left hover:bg-blue-tint ${focusRing}`}>
          <Plus className="size-5 shrink-0 text-blue" aria-hidden />
          <span className="flex-1">
            <span className="block font-semibold text-navy">{c.add}</span>
            <span className="block text-[14px] leading-5 text-slate">{copy.live.addInApp}</span>
          </span>
        </Link>
      ) : (
        <button type="button" onClick={onAdd} className={`mt-6 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-sky px-4 py-3 text-left hover:bg-blue-tint ${focusRing}`}>
          <Plus className="size-5 shrink-0 text-blue" aria-hidden />
          <span className="flex-1">
            <span className="block font-semibold text-navy">{c.add}</span>
            <span className="block text-[14px] leading-5 text-slate">{c.addBody}</span>
          </span>
        </button>
      )}
    </>
  )
}

function DisputeForm({ copy, name }: { copy: Copy; name: string }) {
  const c = copy.dispute
  const [details, setDetails] = React.useState("")
  const [error, setError] = React.useState("")
  const [sent, setSent] = React.useState(false)
  if (sent) return <Note tone="success" className="mt-3" title={c.title}>{c.sent}</Note>
  return (
    <form
      noValidate
      className="mt-3 flex flex-col gap-3 border-t border-line pt-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (details.trim().length < 10) return setError(c.short)
        setSent(true)
      }}
    >
      <p className="text-[15px] leading-6 text-slate">{fill(c.body, { name })}</p>
      <Field label={c.why} htmlFor="dispute-why" error={error}>
        <textarea id="dispute-why" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={c.whyPlaceholder} aria-invalid={!!error || undefined} className={cn(inputCls, "h-auto py-3")} />
      </Field>
      <button type="submit" className={cn(btnPrimary, "self-start")}>
        {c.send}
      </button>
    </form>
  )
}

// ------------------------------------------------------------------ B-03 add

function AddStep({ copy, groups, listings, onCreated, onPick }: { copy: Copy; groups: Group[]; listings: Claimable[]; onCreated: (l: Claimable) => void; onPick: (l: Claimable) => void }) {
  const c = copy.add
  const [name, setName] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [postcode, setPostcode] = React.useState("")
  const [legalType, setLegalType] = React.useState<"sole_trader" | "partnership" | "ltd">("sole_trader")
  const [company, setCompany] = React.useState("")
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof c.errors, string>>>({})
  const [dupes, setDupes] = React.useState<Claimable[] | null>(null)

  const create = () => {
    const leaf = groups.flatMap((g) => g.leaves).find((x) => x.id === categoryId)
    const ini = name
      .replace(/&/g, " ")
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("")
    const digits = phone.replace(/\s/g, "")
    onCreated({
      id: "new",
      slug: "new",
      name: name.trim(),
      initials: ini || "?",
      tone: "blue",
      categoryName: leaf?.name ?? "",
      address: postcode.trim().toUpperCase(),
      district: district(postcode),
      layer: "seeded",
      masked: `${digits.slice(0, 5)} •••${digits.slice(-3)}`,
      landline: /^0(1|2)/.test(digits),
      ltd: legalType === "ltd",
      triedThisMonth: 0,
      source: "",
    })
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (name.trim().length < 2) errs.name = c.errors.name
    if (!categoryId) errs.category = c.errors.category
    if (!/^0\d{9,10}$/.test(phone.replace(/\s/g, ""))) errs.phone = c.errors.phone
    if (!POSTCODE.test(postcode.trim())) errs.postcode = c.errors.postcode
    if (legalType === "ltd" && !/^\d{8}$/.test(company.trim())) errs.company = c.errors.company
    setErrors(errs)
    if (Object.keys(errs).length) return
    const found = listings.filter((l) => l.layer !== "claimed" && l.district === district(postcode) && nameSimilarity(name, l.name) >= 0.6)
    if (found.length && dupes === null) return setDupes(found)
    create()
  }

  if (dupes?.length) {
    return (
      <>
        <Heading sub={copy.confirm.body}>{copy.confirm.heading}</Heading>
        <ul className="mt-5 flex flex-col gap-2">
          {dupes.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onPick(l)} className={`flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left hover:border-blue ${focusRing}`}>
                <Row l={l} />
                <ChevronRight className="size-5 shrink-0 text-muted-ink" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className={cn(btnSecondary, "mt-5")} onClick={create}>
          {c.continue}
        </button>
      </>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <Heading sub={c.body}>{c.heading}</Heading>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={c.name} htmlFor="ad-name" error={errors.name} className="sm:col-span-2">
          <input id="ad-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name || undefined} autoComplete="organization" />
        </Field>
        <Field label={c.category} htmlFor="ad-cat" error={errors.category}>
          <select id="ad-cat" className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-invalid={!!errors.category || undefined}>
            <option value="">{c.categoryPlaceholder}</option>
            {groups.map((g) => (
              <optgroup key={g.id} label={g.name}>
                {g.leaves.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label={c.phone} htmlFor="ad-phone" error={errors.phone}>
          <input id="ad-phone" type="tel" className={cn(inputCls, "tnum")} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900123" aria-invalid={!!errors.phone || undefined} autoComplete="tel" />
        </Field>
        <Field label={c.postcode} htmlFor="ad-pc" error={errors.postcode} hint={c.postcodeHint}>
          <input id="ad-pc" className={cn(inputCls, "uppercase")} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SE25 4AA" aria-invalid={!!errors.postcode || undefined} aria-describedby="ad-pc-msg" autoComplete="postal-code" />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="text-[15px] leading-5 font-semibold text-navy">{c.type}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(Object.keys(c.types) as (keyof typeof c.types)[]).map((v) => (
              <label key={v} className={cn("flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 text-[15px] font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue", legalType === v ? "border-blue bg-blue-tint text-navy" : "border-line text-navy hover:border-blue/50")}>
                <input type="radio" name="legal" value={v} checked={legalType === v} onChange={() => setLegalType(v)} className="sr-only" />
                {c.types[v]}
              </label>
            ))}
          </div>
        </fieldset>
        {legalType === "ltd" && (
          <Field label={c.company} htmlFor="ad-co" error={errors.company} hint={c.companyHint}>
            <input id="ad-co" inputMode="numeric" className={cn(inputCls, "tnum")} value={company} onChange={(e) => setCompany(e.target.value)} aria-invalid={!!errors.company || undefined} aria-describedby="ad-co-msg" />
          </Field>
        )}
      </div>
      <button type="submit" className={cn(btnPrimary, "mt-6")}>
        {c.continue}
      </button>
    </form>
  )
}

// ------------------------------------------------------------------ B-02 confirm

// ------------------------------------------------------------------ API mode: sign in before claiming

function SignInStep({ copy, l }: { copy: Copy; l: Claimable }) {
  const next = l.slug ? `/claim?listing=${l.slug}` : "/claim"
  return (
    <>
      <Heading sub={copy.live.signInBody}>{fill(copy.live.signInHeading, { name: l.name })}</Heading>
      <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className={cn(btnPrimary, "mt-6")}>
        {copy.live.signIn}
      </Link>
    </>
  )
}

function ConfirmStep({ copy, l, busy, error, onYes, onNo }: { copy: Copy; l: Claimable; busy?: boolean; error?: string; onYes: () => void; onNo: () => void }) {
  const c = copy.confirm
  return (
    <>
      <Heading sub={c.body}>{c.heading}</Heading>
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line p-4">
        <Avatar l={l} size={56} />
        <div className="min-w-0">
          <p className="text-[17px] leading-6 font-semibold text-navy">{l.name}</p>
          <p className="text-[14px] leading-5 text-muted-ink">
            {l.categoryName} · {l.address}
          </p>
          <p className="mt-2 inline-flex h-6 items-center rounded-full border border-line bg-sky px-2.5 text-[12px] font-medium text-slate">{l.source}</p>
        </div>
      </div>
      {l.triedThisMonth > 0 && (
        <Note tone="info" className="mt-4" title={l.triedThisMonth === 1 ? c.triedOne : fill(c.tried, { n: l.triedThisMonth })}>
          <span className="inline-flex items-start gap-2">
            <MessageSquare className="mt-1 size-4 shrink-0 text-blue" aria-hidden />
            {c.triedBody}
          </span>
        </Note>
      )}
      {error && <Note tone="error" className="mt-4" title={error} />}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button type="button" className={btnPrimary} onClick={onYes} disabled={busy}>
          {busy ? copy.live.working : c.yes}
        </button>
        <button type="button" className={btnSecondary} onClick={onNo}>
          {c.no}
        </button>
      </div>
    </>
  )
}

// ------------------------------------------------------------------ B-04 verify

function VerifyStep({ copy, l, onChoose }: { copy: Copy; l: Claimable; onChoose: (m: Method) => void }) {
  const c = copy.verify
  const options: { m: Method; icon: typeof PhoneCall; title: string; body: string; show: boolean }[] = [
    { m: "sms", icon: Smartphone, title: fill(c.sms.title, { masked: l.masked }), body: c.sms.body, show: !l.landline },
    { m: "call", icon: PhoneCall, title: fill(c.call.title, { masked: l.masked }), body: c.call.body, show: true },
    { m: "director", icon: Building2, title: c.director.title, body: c.director.body, show: l.ltd },
    { m: "document", icon: FileText, title: c.document.title, body: c.document.body, show: true },
  ]
  return (
    <>
      <Heading sub={c.body}>{fill(c.heading, { name: l.name })}</Heading>
      {l.landline && <p className="mt-3 text-[14px] leading-5 text-muted-ink">{c.landline}</p>}
      <ul className="mt-5 flex flex-col gap-2">
        {options
          .filter((o) => o.show)
          .map((o) => (
            <li key={o.m}>
              <button type="button" onClick={() => onChoose(o.m)} className={`flex w-full items-center gap-3 rounded-2xl border border-line p-4 text-left hover:border-blue ${focusRing}`}>
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-tint text-blue">
                  <o.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="tnum block font-semibold text-navy">{o.title}</span>
                  <span className="block text-[14px] leading-5 text-muted-ink">{o.body}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-ink" aria-hidden />
              </button>
            </li>
          ))}
      </ul>
    </>
  )
}

// ------------------------------------------------------------------ B-05 code

function CodeStep({ copy, l, method, verify, onDone }: { copy: Copy; l: Claimable; method: Method; verify?: Verify; onDone: () => void }) {
  const c = copy.code
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  // API mode: ask for the text or call as the step opens, then send the code back
  const sent = React.useRef(false)
  React.useEffect(() => {
    if (!verify || sent.current) return
    sent.current = true
    verify(method).then((err) => err && setError(err))
  }, [verify, method])
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        if (code.length !== 6) return setError(c.short)
        if (verify) {
          setBusy(true)
          const err = await verify(method, { code })
          setBusy(false)
          if (err) {
            setCode("")
            return setError(err)
          }
          return onDone()
        }
        if (code === "000000") {
          setCode("")
          return setError(c.wrong)
        }
        onDone()
      }}
    >
      <Heading sub={fill(method === "sms" ? c.sms : c.call, { masked: l.masked })}>{c.heading}</Heading>
      <Field label={c.label} htmlFor="claim-code" error={error} hint={verify ? undefined : c.hint} className="mt-6">
        <CodeInput id="claim-code" value={code} onChange={setCode} invalid={!!error} describedBy="claim-code-msg" />
      </Field>
      <button type="submit" className={cn(btnPrimary, "mt-6")} disabled={busy}>
        {busy ? copy.live.working : c.submit}
      </button>
    </form>
  )
}

// ------------------------------------------------------------------ B-06 director

function DirectorStep({ copy, l, verify, onDone, onDocument }: { copy: Copy; l: Claimable; verify?: Verify; onDone: () => void; onDocument: () => void }) {
  const c = copy.director
  const company = findCompany(l.name)
  const [fullName, setFullName] = React.useState("")
  const [month, setMonth] = React.useState("")
  const [year, setYear] = React.useState("")
  const [error, setError] = React.useState("")
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        if (!fullName.trim() || !month || !/^\d{4}$/.test(year)) return setError(c.missing)
        if (verify) {
          // API mode: Companies House is checked on the server
          const err = await verify("director", { fullName: fullName.trim(), birthMonth: Number(month), birthYear: Number(year) })
          return err ? setError(err) : onDone()
        }
        if (!matchDirector(company, fullName, `${month}/${year}`)) return setError(c.noMatch)
        onDone()
      }}
    >
      <Heading sub={company ? fill(c.bodyCompany, { company: company.name, number: company.number }) : c.body}>{c.heading}</Heading>
      {error && (
        <Note tone="error" className="mt-4" title={error}>
          <button type="button" onClick={onDocument} className={cn(btnSecondary, "mt-2 h-11 px-4 text-[15px]")}>
            {c.useDocument}
          </button>
        </Note>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_130px_130px]">
        <Field label={c.fullName} htmlFor="dir-name">
          <input id="dir-name" className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label={c.month} htmlFor="dir-month">
          <select id="dir-month" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">MM</option>
            {copy.months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label={c.year} htmlFor="dir-year">
          <input id="dir-year" inputMode="numeric" className={cn(inputCls, "tnum")} value={year} onChange={(e) => setYear(e.target.value)} placeholder="1985" />
        </Field>
      </div>
      {company && !verify && (
        <p className="mt-3 text-[14px] leading-5 text-muted-ink">
          {fill(c.hint, {
            officers: company.officers
              .filter((o) => o.role === "director")
              .map((o) => `${o.name} (${o.born})`)
              .join("; "),
          })}
        </p>
      )}
      <button type="submit" className={cn(btnPrimary, "mt-6")}>
        {c.submit}
      </button>
    </form>
  )
}

// ------------------------------------------------------------------ B-07 document

function DocumentStep({ copy, verify, onDone }: { copy: Copy; verify?: Verify; onDone: () => void }) {
  const c = copy.document
  const [kind, setKind] = React.useState<string>(c.kinds[0])
  const [file, setFile] = React.useState("")
  const [error, setError] = React.useState("")
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        if (!file) return setError(c.missing)
        if (verify) {
          const err = await verify("document", { kind, fileName: file })
          if (err) return setError(err)
        }
        onDone()
      }}
    >
      <Heading sub={c.body}>{c.heading}</Heading>
      <div className="mt-6 grid gap-4">
        <Field label={c.kind} htmlFor="doc-kind">
          <select id="doc-kind" className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
            {c.kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label={c.file} htmlFor="doc-file" hint={c.fileHint} error={error}>
          <input id="doc-file" type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} aria-describedby="doc-file-msg" className={cn(inputCls, "h-auto py-2.5 file:mr-3 file:rounded-full file:border-0 file:bg-blue-tint file:px-3 file:py-1 file:font-semibold file:text-blue")} />
        </Field>
      </div>
      <button type="submit" className={cn(btnPrimary, "mt-6")}>
        {c.submit}
      </button>
    </form>
  )
}

// ------------------------------------------------------------------ B-08 done → the app

function DoneStep({ copy, l, pending, qr, badges }: { copy: Copy; l: Claimable; pending: boolean; qr: React.ReactNode; badges: React.ReactNode }) {
  const c = copy.done
  return (
    <div className="text-center">
      <span aria-hidden className={cn("mx-auto grid size-16 place-items-center rounded-full", pending ? "bg-amber-tint text-amber-ink" : "bg-teal-tint text-teal-ink")}>
        {pending ? <Clock className="size-8" /> : <CheckCircle2 className="size-9" />}
      </span>
      <div className="mt-4">
        <Heading sub={pending ? c.pendingBody : c.verifiedBody}>{pending ? c.pending : fill(c.verified, { name: l.name })}</Heading>
      </div>
      <div className="mt-6 rounded-2xl bg-sky p-4 text-left">
        <p className="text-[14px] leading-5 text-slate">{c.history}</p>
        <p className="tnum font-semibold text-navy">{l.triedThisMonth ? fill(c.historyBody, { n: l.triedThisMonth }) : c.historyNone}</p>
      </div>
      <section aria-labelledby="claim-app-h" className="mt-6 rounded-2xl border border-line p-5 md:p-6">
        <h2 id="claim-app-h" className="text-[20px] leading-7 font-bold text-navy">
          {c.appHeading}
        </h2>
        <p className="mt-1 text-slate">{c.appBody}</p>
        <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
          <figure className="hidden flex-col items-center gap-2 sm:flex">
            <div className="rounded-2xl border border-line p-3">{qr}</div>
            <figcaption className="text-[13px] leading-4 text-muted-ink">{c.scan}</figcaption>
          </figure>
          {badges}
        </div>
      </section>
      <div className="mt-6">
        <PrototypeLabel>{copy.prototypeNote}</PrototypeLabel>
      </div>
    </div>
  )
}
