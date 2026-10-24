"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { Field, TextInput } from "@/components/answerd/Fields"
import { OsAlert } from "@/components/app/OsDialogs"
import { useStore } from "@/lib/store"

/** C-03: Use my location (mock OS prompt) or enter a postcode. */
export default function LocationOnboarding() {
  const router = useRouter()
  const setLocation = useStore((s) => s.setLocation)
  const setOnboarded = useStore((s) => s.setOnboarded)
  const [prompt, setPrompt] = React.useState(false)
  const [denied, setDenied] = React.useState(false)
  const [pc, setPc] = React.useState("")
  const [err, setErr] = React.useState("")

  const finish = () => {
    setOnboarded()
    router.replace("/app")
  }
  return (
    <AppScreen id="C-03" bg="white">
      <div className="flex h-full flex-col px-6 pb-6">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative mb-8 flex size-44 items-center justify-center rounded-full bg-blue-tint">
            <div className="absolute inset-6 rounded-full border-2 border-dashed border-blue/30" />
            <MapPin className="size-16 text-blue" strokeWidth={1.5} aria-hidden />
          </div>
          <h1 className="t-display">Find businesses near you</h1>
          <p className="mt-3 t-body text-slate">We use your location to show who&apos;s nearby and how far away they are. We never share it with businesses.</p>
        </div>
        {denied ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!setLocation(pc)) return setErr("We don't recognise that postcode. Try one like SE25 4AA.")
              finish()
            }}
          >
            <Field label="Your postcode" htmlFor="pc" error={err} hint="Location is off, so enter a postcode instead.">
              <TextInput id="pc" value={pc} onChange={(e) => setPc(e.target.value)} placeholder="SE25 4AA" autoComplete="postal-code" aria-invalid={!!err} autoFocus />
            </Field>
            <Button block type="submit">
              Continue
            </Button>
          </form>
        ) : (
          <div className="space-y-2">
            <Button block onClick={() => setPrompt(true)}>
              Use my location
            </Button>
            <Button block variant="secondary" onClick={() => router.push("/app/location?next=/app&onboarding=1")}>
              Enter a postcode
            </Button>
          </div>
        )}
      </div>
      <OsAlert
        open={prompt}
        title="Allow “Answerd” to use your location?"
        body="Your location is used to show local businesses and distances."
        actions={[
          { label: "Allow once", onClick: () => (setLocation("SE25 4AA"), setPrompt(false), finish()) },
          { label: "Allow while using the app", bold: true, onClick: () => (setLocation("SE25 4AA"), setPrompt(false), finish()) },
          { label: "Don't allow", onClick: () => (setPrompt(false), setDenied(true)) },
        ]}
      />
    </AppScreen>
  )
}
