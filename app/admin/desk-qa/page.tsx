"use client"
import * as React from "react"
import { Shuffle } from "lucide-react"
import { AdminPage, KeyValues, Panel, Pill, ReasonButton } from "@/components/admin/kit"
import { DataGate } from "@/components/app/helpers"
import { Button } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { fmtDate, fmtDuration, fmtTime } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Call } from "@/lib/types"

type Qa = NonNullable<Call["qa"]>
const QA: { value: Qa; label: string; tone: "good" | "warn" | "bad" | "info"; variant: "primary" | "secondary" | "destructive" }[] = [
  { value: "good", label: "Good", tone: "good", variant: "primary" },
  { value: "wrong_info", label: "Wrong info", tone: "warn", variant: "secondary" },
  { value: "bad_handoff", label: "Bad handoff", tone: "warn", variant: "secondary" },
  { value: "unsafe", label: "Unsafe", tone: "bad", variant: "destructive" },
]

function shuffleKey(id: string, seed: number) {
  let h = seed * 2654435761
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return h >>> 0
}

/** A-12: random sample of desk conversations with transcripts; rate Good, Wrong info, Bad handoff, Unsafe. */
export default function DeskQa() {
  const s = useStore()
  const [seed, setSeed] = React.useState(1)
  const all = s.calls.filter((c) => c.outcome === "desk" && c.transcript?.length)
  const sample = [...all].sort((a, b) => shuffleKey(a.id, seed) - shuffleKey(b.id, seed)).slice(0, 8)
  const [picked, setPicked] = React.useState<string | null>(null)
  const call = sample.find((c) => c.id === picked) ?? sample[0]
  const listing = s.listings.find((l) => l.id === call?.listingId)
  const counts = Object.fromEntries(QA.map((q) => [q.value, all.filter((c) => c.qa === q.value).length])) as Record<Qa, number>
  const fixes = all.filter((c) => c.qa && c.qa !== "good")
  return (
    <AdminPage
      id="A-12"
      title="Desk QA"
      perm="desk_qa"
      description="A random sample of AI desk calls. Anything not rated Good goes to the prompt-fix backlog for the AskBridge team."
      actions={
        <Button variant="secondary" size="md" onClick={() => { setSeed((x) => x + 1); setPicked(null) }}>
          <Shuffle aria-hidden /> New sample
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Pill tone="plain">{all.length} desk calls</Pill>
        {QA.map((q) => (
          <Pill key={q.value} tone={q.tone}>
            {q.label}: {counts[q.value]}
          </Pill>
        ))}
        <Pill tone="plain">Unrated: {all.filter((c) => !c.qa).length}</Pill>
      </div>
      <DataGate isEmpty={sample.length === 0} empty={<EmptyState title="No desk calls yet" body="Run a desk simulation from the hub to create one." />}>
        <div className="grid grid-cols-[320px_1fr] gap-4">
          <ul className="space-y-2" aria-label="Sampled conversations">
            {sample.map((c) => {
              const l = s.listings.find((x) => x.id === c.listingId)
              const active = c.id === call?.id
              const q = QA.find((x) => x.value === c.qa)
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => setPicked(c.id)} aria-current={active || undefined} className={cn("w-full rounded-xl border p-3 text-left", active ? "border-blue bg-blue-tint/60" : "border-line bg-white hover:border-blue/50")}>
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate t-label text-navy">{l?.name}</span>
                      {q ? <Pill tone={q.tone}>{q.label}</Pill> : <Pill>Unrated</Pill>}
                    </span>
                    <span className="mt-0.5 block truncate t-caption text-muted-ink">
                      {fmtDate(c.startedAt)}, {fmtTime(c.startedAt)} · {c.summary}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {call && listing && (
            <Panel title={`${listing.name} · call from ${call.customerName ?? call.callerMasked}`}>
              <div className="grid grid-cols-[1.4fr_1fr] gap-5">
                <ol className="max-h-[440px] space-y-2 overflow-y-auto pr-2" aria-label="Transcript">
                  {call.transcript!.map((t, i) => (
                    <li key={i} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-[13.5px]", t.speaker === "caller" ? "ml-auto bg-blue text-white" : t.speaker === "desk" ? "bg-teal-tint text-navy" : "border border-line bg-white text-navy")}>
                      <span className={cn("block text-[11px] font-semibold", t.speaker === "caller" ? "text-white/85" : "text-slate")}>
                        {t.speaker === "desk" ? "Answerd desk" : t.speaker === "caller" ? "Caller" : "Owner"} · {fmtDuration(t.atSec)}
                      </span>
                      {t.text}
                    </li>
                  ))}
                </ol>
                <div>
                  <KeyValues
                    rows={[
                      ["Summary", call.summary ?? "—"],
                      ["Duration", fmtDuration(call.durationSec)],
                      ["Booked", call.bookingId ? "Yes" : "No"],
                      ["Recording", call.recordingUrl ?? "—"],
                      ["Rating", QA.find((q) => q.value === call.qa)?.label ?? "Not rated"],
                    ]}
                  />
                  <h3 className="mb-2 mt-5 t-label text-navy">Rate this conversation</h3>
                  <div className="flex flex-wrap gap-2">
                    {QA.map((q) => (
                      <ReasonButton
                        key={q.value}
                        perm="desk_qa"
                        variant={call.qa === q.value ? "tint" : q.variant}
                        label={q.label}
                        title={`Rate as ${q.label}`}
                        description={q.value === "good" ? "Marks this conversation as a good example." : "Sent to the prompt-fix backlog with your note."}
                        presets={q.value === "good" ? ["Accurate and polite"] : q.value === "wrong_info" ? ["Quoted the wrong price", "Gave the wrong hours"] : q.value === "bad_handoff" ? ["Should have handed off sooner", "Didn't take a callback number"] : ["Gave safety advice it shouldn't have"]}
                        onConfirm={(reason) => {
                          useStore.getState().adminDecide("desk_qa", call.id, q.value, reason)
                          toast(`Rated ${q.label}`)
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </DataGate>
      <h2 className="mb-3 mt-8 text-[19px] font-semibold text-navy">Prompt-fix backlog</h2>
      <Panel>
        {fixes.length ? (
          <ul className="divide-y divide-line text-[13.5px]">
            {fixes.map((c) => {
              const q = QA.find((x) => x.value === c.qa)!
              const note = s.audit.find((a) => a.targetId === c.id && a.action === `desk_qa.${c.qa}`)?.reason
              return (
                <li key={c.id} className="flex min-h-11 items-center gap-3 py-2">
                  <Pill tone={q.tone}>{q.label}</Pill>
                  <span className="flex-1">{s.listings.find((l) => l.id === c.listingId)?.name} · {c.summary}</span>
                  <span className="text-muted-ink">{note}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="t-label font-normal text-muted-ink">Nothing in the backlog. Ratings other than Good land here.</p>
        )}
      </Panel>
    </AdminPage>
  )
}
