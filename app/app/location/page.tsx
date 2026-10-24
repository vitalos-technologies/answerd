"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Briefcase, Clock, House, LocateFixed, MapPin } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { inputCls } from "@/components/answerd/Fields"
import { safeNext, withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { POSTCODES } from "@/lib/geo"
import { cn } from "@/lib/utils"

/** C-15: current location, postcode lookup, saved places and recent areas. */
function LocationPicker() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = safeNext(sp.get("next"))
  const onboarding = sp.get("onboarding") === "1"
  const s = useStore()
  const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)
  const [pc, setPc] = React.useState("")
  const [err, setErr] = React.useState("")

  const choose = (postcode: string) => {
    if (!s.setLocation(postcode)) {
      setErr(`We don't recognise “${postcode}”. Check it and try again, for example SE25 4AA.`)
      return
    }
    if (onboarding) s.setOnboarded()
    router.replace(next)
  }
  const suggestions = pc.trim().length >= 2 ? POSTCODES.filter((p) => p.postcode.replace(" ", "").startsWith(pc.toUpperCase().replace(/\s/g, ""))).slice(0, 5) : []

  return (
    <AppScreen id="C-15" bg="white" header={<TopBar title="Choose a location" back tone="clear" />}>
      <div className="px-4 pb-6">
        <button type="button" onClick={() => choose("SE25 4AA")} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-1 text-left hover:bg-sky">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-blue-tint text-blue">
            <LocateFixed className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block t-label text-blue">Use current location</span>
            <span className="block t-caption text-muted-ink">Prototype: South Norwood, SE25</span>
          </span>
        </button>

        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (pc.trim()) choose(pc.trim())
          }}
        >
          <label htmlFor="pc" className="t-label text-navy">
            Postcode
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="pc"
              value={pc}
              onChange={(e) => {
                setPc(e.target.value)
                setErr("")
              }}
              placeholder="e.g. SE25 4AA or CR0"
              autoComplete="postal-code"
              aria-invalid={!!err}
              aria-describedby={err ? "pc-err" : undefined}
              className={cn(inputCls, "flex-1 uppercase placeholder:normal-case")}
            />
            <Button type="submit" size="lg" className="px-5">
              Find
            </Button>
          </div>
          {err && (
            <p id="pc-err" role="alert" className="mt-1.5 t-caption text-red">
              {err}
            </p>
          )}
          {suggestions.length > 0 && (
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line" aria-label="Matching postcodes">
              {suggestions.map((p) => (
                <li key={p.postcode}>
                  <button type="button" onClick={() => choose(p.postcode)} className="flex min-h-12 w-full items-center gap-3 px-3 text-left hover:bg-sky">
                    <MapPin className="size-4 text-blue" aria-hidden />
                    <span className="t-label text-navy tnum">{p.postcode}</span>
                    <span className="t-caption text-muted-ink">{p.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        {profile && profile.savedPlaces.length > 0 && (
          <section className="mt-6" aria-labelledby="saved">
            <h2 id="saved" className="mb-1 t-subhead">
              Saved places
            </h2>
            <ul className="divide-y divide-line">
              {profile.savedPlaces.map((p) => {
                const I = /home/i.test(p.label) ? House : /work/i.test(p.label) ? Briefcase : MapPin
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => choose(p.postcode)} className="flex min-h-14 w-full items-center gap-3 text-left">
                      <span className="inline-flex size-10 items-center justify-center rounded-full bg-sky text-navy">
                        <I className="size-5" aria-hidden />
                      </span>
                      <span>
                        <span className="block t-label text-navy">{p.label}</span>
                        <span className="block t-caption text-muted-ink tnum">
                          {p.postcode} · {p.area}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {s.session.recentAreas.length > 0 && (
          <section className="mt-6" aria-labelledby="recent-areas">
            <h2 id="recent-areas" className="mb-1 t-subhead">
              Recent areas
            </h2>
            <ul className="divide-y divide-line">
              {s.session.recentAreas.map((a) => (
                <li key={a}>
                  <button type="button" onClick={() => choose(a.split(" · ")[0]!)} className="flex min-h-12 w-full items-center gap-3 text-left t-label font-normal text-navy">
                    <Clock className="size-4 text-muted-ink" aria-hidden /> {a}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppScreen>
  )
}

export default withSuspense(LocationPicker)
