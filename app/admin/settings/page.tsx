"use client"
import * as React from "react"
import { Power, ShieldAlert } from "lucide-react"
import { AdminPage, DENIED, Panel, Pill, ReasonDialog, useCan, adminInput } from "@/components/admin/kit"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { OTPInput } from "@/components/answerd/OTPInput"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import type { Settings } from "@/lib/types"

function FlagRow({ label, description, flag }: { label: string; description: string; flag: "featuredOn" | "gapFillOn" }) {
  const value = useStore((s) => s.settings[flag])
  const can = useCan()
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  return (
    <div className="flex min-h-16 items-center gap-4 border-b border-line py-3 last:border-0">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block t-label text-navy">{label}</span>
        <span className="block t-caption text-muted-ink">{description}</span>
      </label>
      <Pill tone={value ? "good" : "plain"}>{value ? "On" : "Off"}</Pill>
      <Switch id={id} checked={value} disabled={!can("settings")} onCheckedChange={() => setOpen(true)} className="data-[state=checked]:bg-blue" aria-describedby={!can("settings") ? `${id}-d` : undefined} />
      {!can("settings") && <span id={`${id}-d`} className="sr-only">{DENIED.settings}</span>}
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title={`Turn ${label.toLowerCase()} ${value ? "off" : "on"}?`}
        confirmLabel={value ? "Turn off" : "Turn on"}
        destructive={value}
        onConfirm={(reason) => {
          useStore.getState().updateSettings({ [flag]: !value } as Partial<Settings>, reason)
          toast(`${label} ${value ? "off" : "on"}`)
        }}
      />
    </div>
  )
}

function VoiceRow() {
  const value = useStore((s) => s.settings.voiceProvider)
  const can = useCan()
  const [next, setNext] = React.useState<Settings["voiceProvider"] | null>(null)
  return (
    <div className="flex min-h-16 items-center gap-4 py-3">
      <label htmlFor="voice" className="min-w-0 flex-1">
        <span className="block t-label text-navy">Desk voice provider</span>
        <span className="block t-caption text-muted-ink">The speech engine behind the AI desk.</span>
      </label>
      <div className="w-60 shrink-0">
        <select id="voice" value={value} disabled={!can("settings")} onChange={(e) => setNext(e.target.value as Settings["voiceProvider"])} className={adminInput}>
          <option>AskBridge Voice</option>
          <option>AskBridge Voice (beta)</option>
        </select>
      </div>
      <ReasonDialog
        open={!!next}
        onOpenChange={(v) => !v && setNext(null)}
        title={`Switch the voice provider to ${next}?`}
        confirmLabel="Switch"
        onConfirm={(reason) => {
          useStore.getState().updateSettings({ voiceProvider: next! }, reason)
          toast("Voice provider changed")
        }}
      />
    </div>
  )
}

function KillSwitch() {
  const on = useStore((s) => s.settings.killSwitch)
  const desks = useStore((s) => s.deskConfigs)
  const pausedRaw = useStore((s) => s.settings.killSwitchPaused)
  const paused = pausedRaw ?? []
  const can = useCan()
  const [open, setOpen] = React.useState(false)
  const [code, setCode] = React.useState("")
  const running = desks.filter((d) => d.status === "live" || d.status === "trial").length
  return (
    <Panel title={<span className="inline-flex items-center gap-2"><ShieldAlert className="size-4 text-red" aria-hidden />Emergency desk kill switch</span>} className={on ? "border-red" : undefined}>
      {on ? (
        <Banner tone="error" title="Kill switch is on">
          {paused.length} AI desk{paused.length === 1 ? " is" : "s are"} paused. Customers see normal reply times and no listing shows Responds instantly. Owners have been told.
        </Banner>
      ) : (
        <p className="t-body text-slate">
          Pauses every AI desk at once ({running} running now). Listings lose the Responds instantly badge, calls go straight to owners and texts wait for a human. Turning it off restores each desk to how it was.
        </p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <Button variant={on ? "primary" : "destructive"} size="md" disabled={!can("settings")} onClick={() => { setCode(""); setOpen(true) }} aria-describedby={!can("settings") ? "kill-denied" : undefined}>
          <Power aria-hidden /> {on ? "Turn kill switch off" : "Turn kill switch on"}
        </Button>
        {!can("settings") && <span id="kill-denied" className="t-caption text-muted-ink">{DENIED.settings}</span>}
      </div>
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title={on ? "Turn the kill switch off?" : "Pause every AI desk?"}
        description={on ? "Each desk goes back to live or trial, as it was before." : `${running} desks stop answering straight away.`}
        confirmLabel={on ? "Turn off" : "Pause every desk"}
        destructive={!on}
        presets={on ? ["Incident resolved"] : ["Voice provider outage", "Desk giving wrong information"]}
        validate={() => (code.length < 6 ? "Enter the 6-digit code from your authenticator app." : code === "000000" ? "That code didn't match. Try again." : null)}
        onConfirm={(reason) => {
          useStore.getState().adminKillSwitch(!on, reason)
          toast(on ? "Kill switch off. Desks restored." : "Kill switch on. Every desk is paused.")
        }}
      >
        <div>
          <p className="mb-2 t-label text-navy">Authenticator code</p>
          <OTPInput value={code} onChange={setCode} label="Authenticator code" />
        </div>
      </ReasonDialog>
    </Panel>
  )
}

/** A-23: feature flags and the emergency desk kill switch (confirmed with a code). */
export default function AdminSettings() {
  return (
    <AdminPage id="A-23" title="Settings" perm="settings" description="Marketplace-wide switches. Every change asks for a reason and lands in the audit log.">
      <div className="grid grid-cols-[1.1fr_1fr] gap-4">
        <Panel title="Feature flags">
          <FlagRow flag="featuredOn" label="Featured" description="Paid Featured slots show first in results." />
          <FlagRow flag="gapFillOn" label="Gap-fill" description="Google Places results fill thin areas in C-12 and W-02." />
          <VoiceRow />
        </Panel>
        <KillSwitch />
      </div>
    </AdminPage>
  )
}
