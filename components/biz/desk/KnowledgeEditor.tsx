"use client"
import * as React from "react"
import Link from "next/link"
import { ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react"
import { Button, IconButton } from "@/components/answerd/Button"
import { Field, TextArea, TextInput } from "@/components/answerd/Fields"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { areaText, hoursLines } from "@/lib/deskScripts"
import { businessById, deskFor, listingById, servicesFor } from "@/lib/selectors"
import { priceWithVat, durationLabel } from "@/lib/format"
import { uid } from "@/lib/prng"
import { toast } from "@/lib/toast"
import type { QnA } from "@/lib/types"
import { APP_DESK_LINKS, type DeskLinks } from "./common"

function Section({ title, href, children, editLabel }: { title: string; href?: string; children: React.ReactNode; editLabel: string }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="t-label font-semibold text-navy">{title}</p>
        {href && (
          <Link href={href} className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 t-label text-blue hover:underline" aria-label={editLabel}>
            Edit <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      <div className="t-label font-normal text-slate">{children}</div>
    </div>
  )
}

/**
 * B-34 what the desk knows: pulled from the profile with edit links to B-10 to B-17, custom Q&A (add, edit,
 * delete) and a "never say" list. Reused in the W-17 Knowledge tab.
 */
export function KnowledgeEditor({ businessId, links = APP_DESK_LINKS, readOnly }: { businessId: string; links?: DeskLinks; readOnly?: boolean }) {
  const s = useStore()
  const biz = businessById(s, businessId)
  const listing = listingById(s, biz?.listingId)
  const desk = deskFor(s, businessId)
  const [editing, setEditing] = React.useState<QnA | null>(null)
  const [q, setQ] = React.useState("")
  const [a, setA] = React.useState("")
  const [err, setErr] = React.useState<{ q?: string; a?: string }>({})
  const [never, setNever] = React.useState("")
  if (!biz || !listing || !desk) return null
  const svcs = servicesFor(s, businessId)
  const hours = hoursLines(s, listing)

  const openForm = (item: QnA | null) => {
    setEditing(item ?? { id: "", q: "", a: "" })
    setQ(item?.q ?? "")
    setA(item?.a ?? "")
    setErr({})
  }
  const saveQna = () => {
    const e: typeof err = {}
    if (!q.trim()) e.q = "Write the question a customer might ask"
    if (!a.trim()) e.a = "Write the answer the desk should give"
    setErr(e)
    if (e.q || e.a) return
    s.upsertQna(businessId, { id: editing?.id || uid("qa"), q: q.trim(), a: a.trim() })
    toast(editing?.id ? "Answer updated" : "Answer added")
    setEditing(null)
  }
  const addNever = () => {
    const v = never.trim()
    if (!v) return
    s.updateDeskConfig(businessId, { neverSay: [...desk.neverSay, v] })
    setNever("")
    toast("Added to the never-say list")
  }

  return (
    <div className="space-y-5">
      <section aria-labelledby="kn-profile">
        <h2 id="kn-profile" className="mb-2 t-heading">
          From your profile
        </h2>
        <div className="card divide-y divide-line">
          <Section title="Services and prices" href={readOnly ? undefined : links.profile.services} editLabel="Edit services and prices">
            {svcs.length ? (
              <ul className="mt-1 space-y-1">
                {svcs.map((x) => (
                  <li key={x.id} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      {x.name}
                      <span className="text-muted-ink"> · {durationLabel(x.durationMin)}</span>
                    </span>
                    <span className="shrink-0 text-navy tnum">{priceWithVat(x)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No services yet. The desk won&apos;t quote or book until you add some.</p>
            )}
            <p className="mt-1.5 t-caption text-muted-ink">The desk only quotes these prices, never anything outside them.</p>
          </Section>
          <Section title="Hours" href={readOnly ? undefined : links.profile.hours} editLabel="Edit hours">
            {hours.length ? hours.map((h) => <p key={h}>{h}</p>) : <p>No hours set. The desk can&apos;t offer times until you add them.</p>}
          </Section>
          <Section title="Service area" href={readOnly ? undefined : links.profile.area} editLabel="Edit service area">
            <p>{areaText(s, listing)}</p>
            <p className="mt-1 t-caption text-muted-ink">The desk never confirms a job outside this area.</p>
          </Section>
          <Section title="Booking" href={readOnly ? undefined : links.profile.booking} editLabel="Edit booking settings">
            <p>
              {biz.bookingMode === "instant" ? "Instant booking" : "Request to book: you confirm within 2 hours"} · free to cancel until {biz.cancellationPolicy === "48h" ? "48" : "24"} hours before
            </p>
          </Section>
          <Section title="Business details" href={readOnly ? undefined : links.profile.details} editLabel="Edit business details">
            <p>{listing.name}</p>
            <p className="t-caption text-muted-ink">Your personal number is never shared. Callers reach you through your Answerd number.</p>
          </Section>
        </div>
      </section>

      <section aria-labelledby="kn-qna">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="kn-qna" className="t-heading">
            Custom answers
          </h2>
          {!readOnly && !editing && (
            <Button size="sm" variant="tint" onClick={() => openForm(null)}>
              <Plus /> Add Q&amp;A
            </Button>
          )}
        </div>
        {editing && (
          <div className="card mb-3 space-y-3 p-4">
            <p className="t-subhead">{editing.id ? "Edit answer" : "New answer"}</p>
            <Field label="Question" htmlFor="qna-q" error={err.q}>
              <TextInput id="qna-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Do you cover Beckenham?" aria-invalid={!!err.q} />
            </Field>
            <Field label="Answer" htmlFor="qna-a" error={err.a}>
              <TextArea id="qna-a" value={a} onChange={(e) => setA(e.target.value)} placeholder="Yes, we cover BR3." aria-invalid={!!err.a} />
            </Field>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={saveQna}>
                Save
              </Button>
            </div>
          </div>
        )}
        <DataGate isEmpty={!desk.qna.length} rows={2} empty={<div className="card"><EmptyState title="No custom answers yet" body="Add answers to questions your customers often ask, like parking or which areas you cover." /></div>}>
          <ul className="card divide-y divide-line">
            {desk.qna.map((x) => (
              <li key={x.id} className="flex items-start gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="t-label text-navy">{x.q}</p>
                  <p className="t-label font-normal text-slate">{x.a}</p>
                </div>
                {!readOnly && (
                  <>
                    <IconButton label={`Edit answer: ${x.q}`} onClick={() => openForm(x)}>
                      <Pencil />
                    </IconButton>
                    <IconButton
                      label={`Delete answer: ${x.q}`}
                      onClick={() => {
                        s.deleteQna(businessId, x.id)
                        toast("Answer deleted")
                      }}
                    >
                      <Trash2 />
                    </IconButton>
                  </>
                )}
              </li>
            ))}
          </ul>
        </DataGate>
      </section>

      <section aria-labelledby="kn-never">
        <h2 id="kn-never" className="mb-1 t-heading">
          Never say
        </h2>
        <p className="mb-2 t-label font-normal text-slate">Things the desk must never say or promise. It also never shares your personal number or quotes outside your prices.</p>
        <div className="card p-4">
          {desk.neverSay.length ? (
            <ul className="flex flex-wrap gap-2">
              {desk.neverSay.map((n, i) => (
                <li key={`${n}-${i}`} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-sky py-1 pl-3 pr-1 t-label text-navy">
                  {n}
                  {!readOnly && (
                    <button
                      type="button"
                      aria-label={`Remove: ${n}`}
                      onClick={() => {
                        s.updateDeskConfig(businessId, { neverSay: desk.neverSay.filter((_, j) => j !== i) })
                        toast("Removed")
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-full text-slate hover:bg-white"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-label font-normal text-muted-ink">Nothing added yet.</p>
          )}
          {!readOnly && (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                addNever()
              }}
            >
              <label htmlFor="never-say" className="sr-only">
                Add something the desk must never say
              </label>
              <TextInput id="never-say" value={never} onChange={(e) => setNever(e.target.value)} placeholder="e.g. Promise a same-day visit" />
              <Button type="submit" variant="secondary" size="lg" className="shrink-0 px-4" disabled={!never.trim()}>
                Add
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
