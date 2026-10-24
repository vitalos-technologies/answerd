"use client"
import * as React from "react"
import { AlertCircle, AlertTriangle, BadgeCheck, Camera, Clock, FileCheck2, Plus, ShieldCheck, Upload, XCircle } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { Badge } from "@/components/answerd/Badges"
import { Field, TextInput } from "@/components/answerd/Fields"
import { BottomSheet } from "@/components/answerd/Sheet"
import { MockCamera } from "@/components/biz/claim/DocumentUpload"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { addDays, dayKey, fmtDateYear, london, ms, MS_DAY } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { BadgeKind, Credential, CredentialType } from "@/lib/types"
import { FormError, FormSkeleton, Select, useBizRecord } from "./fields"

export const CREDENTIAL_TYPES: { type: CredentialType; label: string; numberLabel: string; numberRequired: boolean; expiry: "required" | "optional" | "none"; badge?: BadgeKind; hint: string }[] = [
  { type: "gas_safe", label: "Gas Safe register", numberLabel: "Gas Safe registration number", numberRequired: true, expiry: "optional", badge: "gas_safe", hint: "Your 6 or 7-digit number from the Gas Safe ID card" },
  { type: "niceic", label: "NICEIC approved contractor", numberLabel: "NICEIC enrolment number", numberRequired: true, expiry: "optional", badge: "niceic", hint: "From your NICEIC certificate" },
  { type: "napit", label: "NAPIT", numberLabel: "NAPIT membership number", numberRequired: true, expiry: "optional", badge: "napit", hint: "From your NAPIT certificate" },
  { type: "insurance", label: "Public liability insurance", numberLabel: "Policy number", numberRequired: false, expiry: "required", badge: "insured", hint: "Upload the schedule showing your cover and expiry date" },
  { type: "dbs", label: "Enhanced DBS check", numberLabel: "Certificate number", numberRequired: false, expiry: "none", badge: "dbs", hint: "Upload your DBS certificate" },
  { type: "qualification", label: "Qualification", numberLabel: "Certificate number", numberRequired: false, expiry: "optional", hint: "For example an NVQ Level 3 or City & Guilds certificate" },
]

export type CredentialState = "pending" | "verified" | "rejected" | "expired" | "expiring"

/** Display status: Pending, Verified, Rejected, Expired, or Expires soon (verified, within 30 days). */
export function credentialState(c: Credential, now: string): CredentialState {
  if (c.status === "rejected") return "rejected"
  if (c.status === "expired" || (c.expiresAt && ms(c.expiresAt) <= ms(now))) return "expired"
  if (c.status === "pending") return "pending"
  if (c.expiresAt && ms(c.expiresAt) - ms(now) <= 30 * MS_DAY) return "expiring"
  return "verified"
}

const CHIP: Record<CredentialState, { label: string; cls: string; icon: typeof Clock; iconCls?: string }> = {
  pending: { label: "Pending", cls: "bg-amber-tint text-amber-ink", icon: Clock },
  verified: { label: "Verified", cls: "bg-teal-tint text-teal-ink", icon: BadgeCheck },
  rejected: { label: "Rejected", cls: "bg-red-tint text-navy", icon: XCircle, iconCls: "text-red" },
  expired: { label: "Expired", cls: "bg-red-tint text-navy", icon: AlertCircle, iconCls: "text-red" },
  expiring: { label: "Expires soon", cls: "bg-amber-tint text-amber-ink", icon: AlertTriangle },
}

export function CredentialChip({ state, className }: { state: CredentialState; className?: string }) {
  const c = CHIP[state]
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 t-caption", c.cls, className)}>
      <c.icon className={cn("size-3.5", c.iconCls)} aria-hidden />
      {c.label}
    </span>
  )
}

/** B-16: credential cards with status chips; Add opens a form with an upload. Verified ones show as listing badges. */
export function CredentialsForm({ businessId, className }: { businessId: string; className?: string; onSaved?: () => void }) {
  const { hydrated, biz } = useBizRecord(businessId)
  const all = useStore((s) => s.credentials)
  const clock = useStore((s) => s.clock)
  const [adding, setAdding] = React.useState<CredentialType | "pick" | null>(null)
  const close = React.useCallback(() => setAdding(null), [])
  if (!hydrated || !biz) return <FormSkeleton rows={3} />
  const mine = all.filter((c) => c.businessId === businessId)
  // Hide rejected or expired entries once a newer one of the same type exists
  const shown = mine
    .filter((c) => !(["rejected", "expired"].includes(credentialState(c, clock)) && mine.some((o) => o.type === c.type && o.submittedAt > c.submittedAt)))
    .sort((a, b) => CREDENTIAL_TYPES.findIndex((t) => t.type === a.type) - CREDENTIAL_TYPES.findIndex((t) => t.type === b.type) || b.submittedAt.localeCompare(a.submittedAt))

  return (
    <div className={className ?? "space-y-4 px-4 py-5"}>
      <p className="t-label font-normal text-slate">We check each document within 1 working day. Verified credentials show as badges on your listing.</p>
      <DataGate
        isEmpty={shown.length === 0}
        rows={3}
        empty={
          <div className="rounded-2xl bg-white p-6 text-center">
            <ShieldCheck className="mx-auto size-8 text-blue" aria-hidden />
            <p className="mt-2 t-subhead">No credentials yet</p>
            <p className="mt-1 t-label font-normal text-slate">Add your insurance and any registrations. Customers look for these badges.</p>
          </div>
        }
      >
        <ul className="space-y-3">
          {shown.map((c) => {
            const st = credentialState(c, clock)
            const def = CREDENTIAL_TYPES.find((t) => t.type === c.type)
            return (
              <li key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="t-subhead">{c.label}</p>
                    {c.number && <p className="t-caption text-muted-ink tnum">No. {c.number}</p>}
                  </div>
                  <CredentialChip state={st} />
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 t-caption">
                  <dt className="text-muted-ink">File</dt>
                  <dd className="truncate text-slate">{c.fileUrl}</dd>
                  {c.expiresAt && (
                    <>
                      <dt className="text-muted-ink">{st === "expired" ? "Expired" : "Expires"}</dt>
                      <dd className="text-slate tnum">{fmtDateYear(c.expiresAt)}</dd>
                    </>
                  )}
                  <dt className="text-muted-ink">Sent</dt>
                  <dd className="text-slate tnum">{fmtDateYear(c.submittedAt)}</dd>
                </dl>
                {st === "rejected" && (
                  <p className="mt-2 rounded-xl bg-red-tint p-2.5 t-caption text-navy">
                    <span className="font-semibold">Why: </span>
                    {c.reason ?? "We couldn't read the document."}
                  </p>
                )}
                {st === "pending" && <p className="mt-2 t-caption text-slate">We&apos;re checking it. You&apos;ll get a notification when it&apos;s done.</p>}
                {(st === "verified" || st === "expiring") && def?.badge && (
                  <p className="mt-2 flex items-center gap-2 t-caption text-slate">
                    Shows on your listing as <Badge kind={def.badge} />
                  </p>
                )}
                {st === "expired" && <p className="mt-2 t-caption text-slate">The badge has been removed from your listing. Upload the new certificate to get it back.</p>}
                {["rejected", "expired", "expiring"].includes(st) && (
                  <Button size="sm" variant="secondary" className="mt-3" onClick={() => setAdding(c.type)}>
                    <Upload /> Upload {st === "rejected" ? "again" : "the new certificate"}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </DataGate>
      <Button block variant={shown.length ? "secondary" : "primary"} onClick={() => setAdding("pick")}>
        <Plus /> Add a credential
      </Button>
      <BottomSheet open={adding !== null} onClose={close} title="Add a credential">
        {adding !== null && (
          <CredentialUpload
            key={adding}
            businessId={businessId}
            initialType={adding === "pick" ? (CREDENTIAL_TYPES.find((t) => !mine.some((c) => c.type === t.type && credentialState(c, clock) !== "rejected"))?.type ?? "insurance") : adding}
            onDone={() => setAdding(null)}
          />
        )}
      </BottomSheet>
    </div>
  )
}

/** The add-credential form (type, number, upload, expiry). Calls uploadCredential, which sets it to pending. */
export function CredentialUpload({ businessId, initialType, onDone }: { businessId: string; initialType: CredentialType; onDone: () => void }) {
  const uploadCredential = useStore((s) => s.uploadCredential)
  const clock = useStore((s) => s.clock)
  const [type, setType] = React.useState<CredentialType>(initialType)
  const [number, setNumber] = React.useState("")
  const [file, setFile] = React.useState("")
  const [expiry, setExpiry] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [camera, setCamera] = React.useState(false)
  const closeCamera = React.useCallback(() => setCamera(false), [])
  const fileRef = React.useRef<HTMLInputElement>(null)
  const def = CREDENTIAL_TYPES.find((t) => t.type === type)!
  const today = dayKey(clock)

  return (
    <form
      className="space-y-4 pt-1"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const errs: Record<string, string> = {}
        if (def.numberRequired && number.trim().length < 4) errs.number = `Enter your ${def.numberLabel.toLowerCase()}`
        if (!file) errs.file = "Add a photo or file of the certificate"
        if (def.expiry === "required" && !expiry) errs.expiry = "Enter the expiry date from the certificate"
        if (expiry && expiry <= today) errs.expiry = "That date has passed. Upload a current certificate."
        setErrors(errs)
        if (Object.keys(errs).length) return
        const [y, m, d] = expiry ? expiry.split("-").map(Number) : []
        uploadCredential(businessId, { type, label: type === "insurance" ? "Public liability insurance" : def.label, number: number.trim(), fileName: file, expiresAt: expiry ? london(y!, m!, d!) : undefined })
        toast("Sent for checking. We'll check it within 1 working day.")
        onDone()
      }}
    >
      <Field label="Type" htmlFor="cr-type">
        <Select id="cr-type" value={type} onChange={(e) => setType(e.target.value as CredentialType)}>
          {CREDENTIAL_TYPES.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={def.numberLabel} htmlFor="cr-num" optional={!def.numberRequired} error={errors.number}>
        <TextInput id="cr-num" value={number} onChange={(e) => setNumber(e.target.value)} className="tnum" aria-invalid={!!errors.number} />
      </Field>
      <div>
        <p className="mb-1.5 t-label text-navy">Certificate</p>
        <p className="mb-2 t-caption text-muted-ink">{def.hint}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload /> Choose file
          </Button>
          <Button variant="secondary" onClick={() => setCamera(true)}>
            <Camera /> Take photo
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a certificate file"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setFile(f.name)
          }}
        />
        {file && (
          <p className="mt-2 flex items-center gap-2 rounded-xl bg-teal-tint p-2.5 t-label text-navy" role="status">
            <FileCheck2 className="size-4 shrink-0 text-teal-ink" aria-hidden />
            <span className="truncate">{file}</span>
          </p>
        )}
        {errors.file && <FormError>{errors.file}</FormError>}
      </div>
      {def.expiry !== "none" && (
        <Field label="Expiry date" htmlFor="cr-exp" optional={def.expiry === "optional"} error={errors.expiry}>
          <TextInput id="cr-exp" type="date" min={dayKey(addDays(clock, 1))} value={expiry} onChange={(e) => setExpiry(e.target.value)} className="tnum" aria-invalid={!!errors.expiry} />
        </Field>
      )}
      <Button block type="submit">
        Send for checking
      </Button>
      <MockCamera
        open={camera}
        onClose={closeCamera}
        title="Photograph the certificate"
        onCapture={(name) => {
          setFile(name)
          setCamera(false)
        }}
      />
    </form>
  )
}
