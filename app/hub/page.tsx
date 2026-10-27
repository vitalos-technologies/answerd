"use client"
import * as React from "react"
import Link from "next/link"
import { Crown, CheckCircle2, Circle, Clock, FastForward, Layers, PlayCircle, RotateCcw, Hash, Eye, CalendarPlus, Gauge, ArrowRight, Smartphone, Globe, LayoutDashboard, Shield, UserCheck, ExternalLink } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { useStore } from "@/lib/store"
import { PERSONAS } from "@/lib/seed"
import { SCREENS, SURFACES, BUILT, DEFERRED, ON_SITE, type Surface } from "@/lib/screens"
import { siteUrl } from "@/lib/site"
import { DESK_EMERGENCIES, DESK_SCRIPTS } from "@/lib/deskScripts"
import { Button } from "@/components/answerd/Button"
import { SegmentedControl } from "@/components/answerd/Status"
import { ToggleRow } from "@/components/answerd/Fields"
import { PersonAvatar } from "@/components/answerd/Media"
import { fmtDateLong, fmtTime } from "@/lib/time"
import { gateStatus, membershipsFor, nextSlots, servicesFor, listingById, rulesFor } from "@/lib/selectors"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import type { StateOverride } from "@/lib/store"
import { DataSourceBadge, DataSourcePanel } from "@/components/hub/DataSource"

const SWIFT = "l-swift-plumbing-heating"

function Section({ title, children, id, action }: { title: string; children: React.ReactNode; id?: string; action?: React.ReactNode }) {
  return (
    <section id={id} className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="t-heading">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function RunLog() {
  const runs = useStore((s) => s.runs)
  const listings = useStore((s) => s.listings)
  const run = runs.at(-1)
  if (!run) return <p className="t-label font-normal text-muted-ink">Run a simulation to watch the desk work. Results land in the inbox, diary and notifications.</p>
  const l = listings.find((x) => x.id === run.listingId)
  return (
    <div className="rounded-xl border border-line bg-sky p-3" aria-live="polite">
      <p className="t-caption text-muted-ink">
        {run.scriptId} · {l?.name} · {run.done ? "finished" : "running"}
      </p>
      <ol className="mt-2 space-y-1.5">
        {run.steps.slice(0, run.done ? run.steps.length : run.cursor).map((st, i) => (
          <li key={i} className="t-label font-normal">
            <span className={cn("mr-1.5 font-semibold", st.speaker === "desk" ? "text-teal-ink" : "text-navy")}>{st.speaker === "desk" ? "Desk" : st.speaker === "caller" ? run.plan.caller.name : "Owner"}:</span>
            <span className="text-slate">{st.text}</span>
          </li>
        ))}
        {!run.done && <li className="t-caption text-muted-ink">…</li>}
      </ol>
      {run.done && (
        <div className="mt-3 flex flex-wrap gap-2">
          {run.callId && (
            <Link className="t-label text-blue hover:underline" href={`/app/biz/calls/${run.callId}`}>
              Open call (B-21)
            </Link>
          )}
          {run.threadId && (
            <Link className="t-label text-blue hover:underline" href={`/app/biz/inbox/${run.threadId}`}>
              Open conversation (B-20)
            </Link>
          )}
          {run.bookingId && (
            <Link className="t-label text-blue hover:underline" href={`/app/biz/jobs/${run.bookingId}`}>
              Open job (B-24)
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

const SURFACE_ICON: Record<Surface, typeof Smartphone> = { customer: Smartphone, business: Smartphone, web: Globe, admin: Shield, super: Crown, desk: PlayCircle, ask: Layers }

export default function HubPage() {
  const s = useStore()
  const [filter, setFilter] = React.useState<"all" | "built" | "todo">("all")
  const gate = gateStatus(s, "biz-swift-plumbing-heating")
  const builtCount = SCREENS.filter((x) => BUILT.has(x.id)).length
  const mems = membershipsFor(s, s.session.userId)

  const customerBooks = () => {
    const l = listingById(s, SWIFT)!
    const svc = servicesFor(s, l.businessId).find((x) => /boiler service/i.test(x.name))
    const slot = nextSlots(s, l, svc, 1)[0]
    if (!slot || !svc) return toast("No free slots for Swift Plumbing")
    const res = s.createBooking({ listingId: SWIFT, serviceId: svc.id, startAt: slot, address: "33 Enmore Road, London", postcode: "SE25 5NQ", notes: "Boiler service, combi, last done 2025.", contactPhone: "07700 900310", customerId: "u-c10", customerName: "Femi A.", createdBy: "customer" })
    if (res.ok) toast(`Femi requested a boiler service, ${fmtTime(slot)}. Sam has a request.`)
  }

  return (
    <div className="min-h-dvh bg-sky">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4 px-6 py-5">
          <Logo size={34} />
          <span className="rounded-full bg-blue-tint px-3 py-1 t-label text-blue">Prototype hub</span>
          <DataSourceBadge />
          <p className="t-label font-normal text-slate">
            {builtCount} of {SCREENS.length} IDs built
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link href="/hub/components" className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 t-label text-navy hover:bg-sky">
              Components
            </Link>
            <Link href="/app/splash" className="inline-flex h-11 items-center gap-2 rounded-full bg-blue px-4 t-label font-semibold text-white hover:bg-blue-hover">
              <Smartphone className="size-4" /> Open the app
            </Link>
            <a href={siteUrl("/")} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 t-label text-navy hover:bg-sky">
              <Globe className="size-4" /> Website <ExternalLink className="size-3.5" aria-label="opens in a new tab" />
            </a>
            <Link href="/dashboard" className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 t-label text-navy hover:bg-sky">
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
            <Link href="/admin" className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 t-label text-navy hover:bg-sky">
              <Shield className="size-4" /> Admin
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-5 px-6 py-6 lg:grid-cols-[1.1fr_1fr]">
        <Section title="Data source" id="data-source">
          <DataSourcePanel />
        </Section>
        <Section title="Persona">
          <div className="grid gap-2 sm:grid-cols-2">
            {PERSONAS.map((p) => {
              const active = s.session.personaId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    s.signIn(p.id)
                    if (p.id === "ife" || p.id === "dan" || p.id === "temitope") s.adminSignIn()
                    toast(`Signed in as ${p.name}`)
                  }}
                  aria-pressed={active}
                  className={cn("flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors", active ? "border-blue bg-blue-tint" : "border-line bg-white hover:border-blue/50")}
                >
                  <PersonAvatar name={p.name === "Guest" ? "G" : p.name} size={36} tone={active ? "navy" : "sky"} />
                  <span className="min-w-0">
                    <span className="block t-label font-semibold text-navy">{p.name}</span>
                    <span className="block t-caption text-muted-ink">{p.role}</span>
                    <span className="mt-1 block t-caption font-normal text-slate">{p.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-4">
            <p className="mb-2 t-label text-navy">App mode</p>
            <SegmentedControl
              label="App mode"
              value={s.session.mode}
              onChange={(m) => {
                if (m === "business" && !mems.length) return toast("This persona has no business. Claim one first.")
                s.setMode(m)
              }}
              options={[
                { value: "customer", label: "Customer" },
                { value: "business", label: "Business" },
              ]}
            />
          </div>
        </Section>

        <Section title="Demo controls">
          <div className="flex items-center gap-3 rounded-2xl bg-sky p-3">
            <Clock className="size-5 text-blue" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="t-caption text-muted-ink">Demo clock (Europe/London)</p>
              <p className="t-subhead tnum">
                {fmtDateLong(s.clock)}, {fmtTime(s.clock)}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => s.advanceClock(2)}>
              <FastForward /> +2 hours
            </Button>
            <Button size="sm" variant="secondary" onClick={() => s.advanceClock(24)}>
              <FastForward /> +1 day
            </Button>
          </div>
          <div className="mt-2 divide-y divide-line">
            <ToggleRow label="Show screen IDs" description="Small ID badge at the top-left of every screen" checked={s.showScreenIds} onChange={s.setShowScreenIds} />
            <ToggleRow label="Go offline" description="Offline banner on every app screen; sends queue with a clock icon" checked={s.offline} onChange={s.setOffline} />
          </div>
          <div className="mt-3">
            <p className="mb-2 flex items-center gap-1.5 t-label text-navy">
              <Eye className="size-4" aria-hidden /> Preview states on list and data screens
            </p>
            <SegmentedControl<StateOverride>
              label="Preview states"
              value={s.stateOverride}
              onChange={s.setStateOverride}
              options={[
                { value: "none", label: "Live" },
                { value: "loading", label: "Loading" },
                { value: "empty", label: "Empty" },
                { value: "error", label: "Error" },
              ]}
            />
          </div>
          <Button variant="destructive" size="md" className="mt-5" onClick={() => s.resetDemo()}>
            <RotateCcw /> Reset demo data
          </Button>
        </Section>

        <Section title="Simulate" id="simulate" action={<span className="t-caption text-muted-ink">Against Swift Plumbing &amp; Heating</span>}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DESK_SCRIPTS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  s.runDeskScript(d.id, SWIFT)
                  toast(`${d.id} running: ${d.title}`)
                }}
                className="flex flex-col items-start rounded-xl border border-line bg-white p-3 text-left hover:border-blue hover:bg-blue-tint"
              >
                <span className="font-mono t-caption text-blue">{d.id}</span>
                <span className="t-label text-navy">{d.title}</span>
                <span className="t-caption font-normal text-muted-ink">{d.trigger}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="t-caption text-muted-ink">Variants:</span>
            {DESK_EMERGENCIES.map((e) => (
              <Button key={e.id} size="sm" variant="secondary" onClick={() => {
                s.runDeskScript("D-09", SWIFT, { emergency: e.id })
                toast(`D-09 running: ${e.label}`)
              }}>
                D-09 {e.label.toLowerCase()}
              </Button>
            ))}
            <Button size="sm" variant="secondary" onClick={() => {
              s.runDeskScript("D-01", SWIFT, { outsideArea: true })
              toast("D-01 running: caller outside the service area")
            }}>
              D-01 outside the area
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="md" variant="secondary" onClick={() => {
              const m = s.members.filter((x) => !x.joinedAt).at(-1)
              if (!m) return toast("No pending staff invites. Invite someone in B-38 first.")
              s.acceptInvite(m.id)
              toast(`${m.name} accepted the invite`)
            }}>
              <UserCheck /> Accept pending staff invite
            </Button>
            <Button size="md" variant="secondary" onClick={customerBooks}>
              <CalendarPlus /> Customer books Swift Plumbing
            </Button>
            <Button size="md" variant="secondary" onClick={() => {
              s.triggerMonetiseGate()
              toast("Monetise gate reached for Swift Plumbing")
            }}>
              <Gauge /> Trigger monetise gate
            </Button>
          </div>
          <p className="mt-2 t-caption text-muted-ink tnum">
            Swift Plumbing gate: {gate.count} of {gate.target} enquiries · day {rulesFor(s).gateDays} is {fmtDateLong(gate.gateDate)} · {gate.met ? "met" : "not met"}
          </p>
        </Section>

        <Section title="Desk activity">
          <RunLog />
        </Section>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="t-title">Every screen</h2>
          <SegmentedControl
            className="ml-auto max-w-xs"
            label="Filter screens"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "built", label: "Built" },
              { value: "todo", label: "To build" },
            ]}
          />
        </div>
        <div className="space-y-8">
          {SURFACES.map((surf) => {
            const list = SCREENS.filter((x) => x.surface === surf.id).filter((x) => (filter === "all" ? true : filter === "built" ? BUILT.has(x.id) : !BUILT.has(x.id)))
            const I = SURFACE_ICON[surf.id]
            return (
              <section key={surf.id} aria-labelledby={`surf-${surf.id}`}>
                <h3 id={`surf-${surf.id}`} className="mb-3 flex items-center gap-2 t-heading">
                  <I className="size-5 text-blue" aria-hidden /> {surf.name}
                  <span className="t-label font-normal text-muted-ink tnum">
                    {SCREENS.filter((x) => x.surface === surf.id && BUILT.has(x.id)).length}/{surf.count} built
                  </span>
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {list.map((x) => {
                    const site = ON_SITE[x.id]
                    const Tag = site ? "a" : Link
                    return (
                      <Tag key={x.id} href={site ? siteUrl(site) : x.example} {...(site && { target: "_blank", rel: "noopener" })} className="group flex items-start gap-2.5 rounded-xl border border-line bg-white p-3 hover:border-blue">
                      {BUILT.has(x.id) ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-ink" aria-label="Built" /> : <Circle className="mt-0.5 size-4 shrink-0 text-line" aria-label="Not built yet" />}
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono t-caption text-blue">{x.id}</span>
                        <span className="block t-label text-navy">{x.title}</span>
                        {DEFERRED.has(x.id) && <span className="mt-1 inline-block rounded-full bg-amber-tint px-2 py-0.5 t-caption text-amber-ink">Deferred: app first</span>}
                        {site && <span className="mt-1 inline-block rounded-full bg-blue-tint px-2 py-0.5 t-caption text-blue">On the website</span>}
                        <span className="block truncate t-caption font-normal text-muted-ink">{site ?? x.route}</span>
                      </span>
                      {site ? (
                        <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-ink" aria-label="opens the website in a new tab" />
                      ) : (
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-ink opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      )}
                    </Tag>
                    )
                  })}
                  {!list.length && <p className="t-label font-normal text-muted-ink">Nothing here for this filter.</p>}
                </div>
              </section>
            )
          })}
        </div>
        <p className="mt-10 flex items-center gap-2 t-caption text-muted-ink">
          <Hash className="size-3.5" aria-hidden /> Add <code className="rounded bg-white px-1">?clean=1</code> to any URL to hide the Hub button. Mock data only: no backend, no external APIs.
        </p>
      </div>
    </div>
  )
}
