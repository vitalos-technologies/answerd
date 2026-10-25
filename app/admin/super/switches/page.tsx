"use client"
import * as React from "react"
import Link from "next/link"
import { Construction, ShieldAlert } from "lucide-react"
import { Panel, Pill, ReasonDialog, adminInput } from "@/components/admin/kit"
import { SuperPage } from "@/components/admin/super/ui"
import { Button } from "@/components/answerd/Button"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import { platformFor } from "@/lib/selectors"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type Key = "signups" | "claims" | "gapFill" | "payments" | "ask"

const ROWS: { key: Key; label: string; off: string; where: { label: string; href: string }[] }[] = [
  { key: "signups", label: "New sign-ups", off: "New customers can't create an account. Existing customers still sign in.", where: [{ label: "C-06 Phone number", href: "/app/sign-in/phone" }, { label: "C-08 About you", href: "/app/sign-in/about-you" }] },
  { key: "claims", label: "Claims and new listings", off: "Businesses can't claim or add a listing in the app or on the web.", where: [{ label: "B-01 Find your business", href: "/app/biz/claim" }] },
  { key: "gapFill", label: "Google gap-fill", off: "Places results disappear from search; claimed and seeded listings stay.", where: [{ label: "C-12 Results", href: "/app/results?q=plumber" }, { label: "A-16 Places spend", href: "/admin/places" }] },
  { key: "payments", label: "Payments", off: "Checkout is disabled; nothing new is charged. Existing plans keep running.", where: [{ label: "B-36 Plan and billing", href: "/app/biz/billing" }, { label: "W-18 Checkout", href: "/dashboard/billing/checkout?plan=desk" }] },
  { key: "ask", label: "Ask Answerd", off: "The assistant shows a paused state; search still works.", where: [{ label: "C-38 Ask Answerd", href: "/app/ask" }] },
]

function SwitchRow({ row, on }: { row: (typeof ROWS)[number]; on: boolean }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  return (
    <div className="flex min-h-20 items-start gap-4 border-b border-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block cursor-pointer t-label text-navy">
          {row.label}
        </label>
        <p className="t-caption text-muted-ink">Off: {row.off}</p>
        <p className="mt-1 flex flex-wrap gap-x-3 t-caption">
          {row.where.map((w) => (
            <Link key={w.href} href={w.href} className="inline-flex min-h-6 items-center text-blue hover:underline">
              {w.label}
            </Link>
          ))}
        </p>
      </div>
      <Pill tone={on ? "good" : "bad"}>{on ? "On" : "Off"}</Pill>
      <Switch id={id} checked={on} onCheckedChange={() => setOpen(true)} className="data-[state=checked]:bg-blue" />
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title={`Turn ${row.label.toLowerCase()} ${on ? "off" : "on"}?`}
        description={on ? row.off : "Customers and businesses get it back straight away."}
        confirmLabel={on ? "Turn off" : "Turn on"}
        destructive={on}
        presets={on ? ["Incident", "Abuse spike", "Planned work"] : ["Incident resolved", "Planned work finished"]}
        onConfirm={(reason) => {
          const st = useStore.getState()
          if (row.key === "gapFill") st.updateSettings({ gapFillOn: !on }, reason)
          else st.setPlatformSwitch({ [row.key]: !on }, reason)
          toast(`${row.label} ${on ? "off" : "on"}`)
        }}
      />
    </div>
  )
}

function Maintenance({ on, message }: { on: boolean; message: string }) {
  const [text, setText] = React.useState(message)
  const [open, setOpen] = React.useState<null | "on" | "off" | "message">(null)
  const id = React.useId()
  const tooShort = text.trim().length < 10
  return (
    <Panel title={<span className="inline-flex items-center gap-2"><Construction className="size-4 text-amber-ink" aria-hidden />Maintenance mode</span>} className={on ? "border-amber" : undefined}>
      <p className="t-body text-slate">{on ? "On. The app shows the maintenance screen (C-48) and the website shows this message in a banner." : "Off. Turning it on shows the maintenance screen on every app screen and a banner on every web page."}</p>
      <label htmlFor={id} className="mt-4 block t-label text-navy">
        Message to customers
      </label>
      <textarea id={id} rows={3} value={text} onChange={(e) => setText(e.target.value)} className={cn(adminInput, "h-auto py-2.5")} aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`} className={tooShort ? "t-caption text-red" : "t-caption text-muted-ink"}>
        {tooShort ? "Write at least 10 characters." : "Say when you'll be back and what still works."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant={on ? "primary" : "destructive"} size="md" disabled={tooShort} onClick={() => setOpen(on ? "off" : "on")}>
          {on ? "End maintenance" : "Start maintenance"}
        </Button>
        {on && (
          <Button variant="secondary" size="md" disabled={tooShort || text.trim() === message} onClick={() => setOpen("message")}>
            Update message
          </Button>
        )}
        <Link href="/app" className="inline-flex min-h-11 items-center px-2 t-label text-blue hover:underline">
          Preview the app
        </Link>
      </div>
      <ReasonDialog
        open={!!open}
        onOpenChange={(v) => !v && setOpen(null)}
        title={open === "on" ? "Start maintenance mode?" : open === "off" ? "End maintenance mode?" : "Update the maintenance message?"}
        description={open === "on" ? "Customers and businesses can't use the app until you end it." : undefined}
        confirmLabel={open === "on" ? "Start maintenance" : open === "off" ? "End maintenance" : "Update message"}
        destructive={open === "on"}
        presets={open === "off" ? ["Work finished"] : ["Database upgrade", "Incident"]}
        onConfirm={(reason) => {
          const st = useStore.getState()
          if (open === "message") st.setPlatformSwitch({ maintenanceMessage: text.trim() }, reason)
          else st.setPlatformSwitch(text.trim() !== message ? { maintenanceMessage: text.trim(), maintenance: open === "on" } : { maintenance: open === "on" }, reason)
          toast(open === "on" ? "Maintenance mode on" : open === "off" ? "Maintenance mode off" : "Message updated")
        }}
      />
    </Panel>
  )
}

/** S-07: kill switches beyond the desk (sign-ups, claims, gap-fill, payments, Ask Answerd) and maintenance mode. */
export default function PlatformSwitches() {
  const settings = useStore((s) => s.settings)
  const p = platformFor({ settings } as Parameters<typeof platformFor>[0])
  return (
    <SuperPage id="S-07" title="Platform switches" description="Each switch takes effect at once in the app, on the web and in the console. Every flip asks for a reason and lands in the security log.">
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Kill switches">
          {ROWS.map((r) => (
            <SwitchRow key={r.key} row={r} on={p[r.key]} />
          ))}
        </Panel>
        <div className="space-y-4">
          <Maintenance key={p.maintenanceMessage} on={p.maintenance} message={p.maintenanceMessage} />
          <Panel title={<span className="inline-flex items-center gap-2"><ShieldAlert className="size-4 text-red" aria-hidden />Desk kill switch</span>}>
            <p className="t-body text-slate">{settings.killSwitch ? "On: every AI desk is paused." : "Off: desks are answering."} It lives in Settings because admins can use it too.</p>
            <Link href="/admin/settings" className="mt-2 inline-flex min-h-11 items-center t-label text-blue hover:underline">
              Open Settings (A-23)
            </Link>
          </Panel>
        </div>
      </div>
    </SuperPage>
  )
}
