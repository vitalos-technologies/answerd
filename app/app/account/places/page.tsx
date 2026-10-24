"use client"
import * as React from "react"
import { Briefcase, House, MapPin, Plus, Trash2 } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button, IconButton } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { EmptyState } from "@/components/answerd/Feedback"
import { Field, TextInput } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"

/** C-41: Home, Work, add place. */
export default function PlacesPage() {
  const s = useStore()
  const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)
  const [adding, setAdding] = React.useState(false)
  const [label, setLabel] = React.useState("")
  const [pc, setPc] = React.useState("")
  const [err, setErr] = React.useState("")
  return (
    <AppScreen id="C-41" header={<TopBar title="Saved places" back="/app/account" />}>
      <div className="space-y-3 p-4">
        {profile?.savedPlaces.length ? (
          <ul className="card divide-y divide-line">
            {profile.savedPlaces.map((p) => {
              const I = /home/i.test(p.label) ? House : /work/i.test(p.label) ? Briefcase : MapPin
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-sky text-navy">
                    <I className="size-5" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="block t-label text-navy">{p.label}</span>
                    <span className="block t-caption text-muted-ink tnum">
                      {p.line1 ? `${p.line1}, ` : ""}
                      {p.postcode} · {p.area}
                    </span>
                  </span>
                  <IconButton label={`Remove ${p.label}`} onClick={() => (s.removeSavedPlace(p.id), toast(`${p.label} removed`))}>
                    <Trash2 />
                  </IconButton>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState title="No saved places" body="Save home and work to book faster." />
        )}
        <Button variant="secondary" block onClick={() => setAdding(true)}>
          <Plus /> Add a place
        </Button>
      </div>
      <BottomSheet open={adding} onClose={() => setAdding(false)} title="Add a place">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!label.trim()) return setErr("Give it a name, like Mum's")
            if (!s.addSavedPlace(label.trim(), pc)) return setErr("We don't recognise that postcode")
            toast(`${label.trim()} saved`)
            setAdding(false)
            setLabel("")
            setPc("")
            setErr("")
          }}
        >
          <Field label="Name" htmlFor="label">
            <TextInput id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Mum's" />
          </Field>
          <Field label="Postcode" htmlFor="pc" error={err}>
            <TextInput id="pc" value={pc} onChange={(e) => setPc(e.target.value)} className="uppercase" placeholder="SE19 2AT" aria-invalid={!!err} />
          </Field>
          <Button block type="submit">
            Save place
          </Button>
        </form>
      </BottomSheet>
    </AppScreen>
  )
}
