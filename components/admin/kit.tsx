"use client"
// Admin console building blocks: page frame with sign-in guard, permissions, reason dialog, tiles and panels.
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Crown, Lock, ShieldAlert } from "lucide-react"
import { useStore, ADMIN_DEFAULT_PERMS, SUPPORT_DEFAULT_PERMS } from "@/lib/store"
import { useAdminRole } from "@/components/shells/AdminShell"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Banner, Skeleton } from "@/components/answerd/Feedback"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { placesHidden } from "@/lib/search"
import { gbp } from "@/lib/format"
import { cn } from "@/lib/utils"

// ------------------------------------------------------------------ permissions (spec › Roles › Permissions)

export type AdminPerm =
  | "claims"
  | "credentials"
  | "reviews"
  | "reports"
  | "listings"
  | "merge"
  | "customers"
  | "desk_qa"
  | "imports"
  | "taxonomy"
  | "places"
  | "billing"
  | "gate"
  | "featured"
  | "content"
  | "users"
  | "settings"
  | "support_view"

export const DENIED: Record<AdminPerm, string> = {
  claims: "Support can't approve claims",
  credentials: "Support can't approve documents",
  reviews: "",
  reports: "Support can only resolve review reports",
  listings: "Support can't edit listings",
  merge: "Support can't merge listings",
  customers: "Support can't suspend or delete customers",
  desk_qa: "Support can't rate desk conversations",
  imports: "Support can't run imports",
  taxonomy: "Support can't edit the taxonomy",
  places: "Support can't set the Places cap",
  billing: "Support can view billing but not change it",
  gate: "Support can't override the monetise gate",
  featured: "Support can't change Featured slots",
  content: "Support can't edit content",
  users: "Support can't invite or remove admin users",
  settings: "Support can't change settings",
  support_view: "",
}

/** What each role may do now: the S-05 matrix (Settings.rolePerms) over the defaults. Super admin can do everything. */
export function permsFor(rolePerms: { admin: string[]; support: string[] } | undefined) {
  return { admin: rolePerms?.admin ?? ADMIN_DEFAULT_PERMS, support: rolePerms?.support ?? SUPPORT_DEFAULT_PERMS }
}

export function useCan() {
  const { role } = useAdminRole()
  const rolePerms = useStore((s) => s.settings.rolePerms)
  return React.useCallback(
    (perm: AdminPerm) => {
      if (role === "super_admin") return true
      const p = permsFor(rolePerms)
      return role === "admin" ? p.admin.includes(perm) : role === "support" ? p.support.includes(perm) : false
    },
    [role, rolePerms],
  )
}

/** Why a button is disabled, worded for the viewer's role. */
export function useDenied() {
  const { role } = useAdminRole()
  return (perm: AdminPerm) => (role === "admin" ? DENIED[perm].replace(/^Support can('t| only)/, "Admins can$1") + " (set by a super admin in S-05)" : DENIED[perm])
}

// ------------------------------------------------------------------ page frame

/** Every admin screen: guard, screen ID, title row, support and Places banners. */
export function AdminPage({
  id,
  title,
  description,
  actions,
  children,
  perm,
  back,
  superOnly,
}: {
  id: string
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  perm?: AdminPerm
  back?: { href: string; label: string }
  /** S-01 to S-10: only the super admin may open the page; everyone else sees a no-access state. */
  superOnly?: boolean
}) {
  const hydrated = useStore((s) => s.hydrated)
  const { role, signedIn } = useAdminRole()
  const router = useRouter()
  const pathname = usePathname()
  const s = useStore()
  const capHit = placesHidden(s) && s.settings.gapFillOn
  const can = useCan()

  React.useEffect(() => {
    if (hydrated && !signedIn) router.replace(`/admin/sign-in?next=${encodeURIComponent(pathname)}`)
  }, [hydrated, signedIn, router, pathname])
  // Coming back to the console from a tenant ends the support view (checked once on arrival)
  React.useEffect(() => {
    const st = useStore.getState()
    if (!hydrated) return
    // R2: an S-09 impersonation (business or customer) ends the same way, audited
    if (st.session.impersonation) st.endImpersonation()
    else if (st.session.supportViewBusinessId) st.setSupportView(null)
  }, [hydrated])

  if (!hydrated || !signedIn) {
    return (
      <div className="space-y-3" aria-busy="true">
        <ScreenMeta id={id} />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    )
  }
  const today = s.placesDays.at(-1)
  if (superOnly && role !== "super_admin") {
    return (
      <div className="mx-auto w-full max-w-[1280px]">
        <ScreenMeta id={id} />
        <NoSuperAccess title={title} />
      </div>
    )
  }
  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <ScreenMeta id={id} />
      {back && (
        <Link href={back.href} className="mb-2 inline-flex min-h-11 items-center t-label text-blue hover:underline">
          ← {back.label}
        </Link>
      )}
      <div className="mb-5 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-semibold tracking-wide text-muted-ink">{id}</p>
          <h1 className="text-[26px] font-bold leading-8 tracking-[-0.01em] text-navy">{title}</h1>
          {description && <div className="mt-1 max-w-3xl t-label font-normal text-slate">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="mb-5 space-y-3 empty:hidden">
        {capHit && (
          <Banner tone="warning" title="Places cap reached: gap-fill is off">
            Today&apos;s Google Places spend is {gbp(today?.spendPence ?? 0)} against a {gbp(s.settings.placesCapPence)} daily cap. Results come from claimed and seeded listings only.{" "}
            <Link href="/admin/places" className="font-semibold text-blue underline-offset-2 hover:underline">
              Change the cap
            </Link>
          </Banner>
        )}
        {s.settings.killSwitch && pathname !== "/admin/settings" && (
          <Banner tone="error" title="Desk kill switch is on">
            Every AI desk is paused. Customers see normal reply times.{" "}
            <Link href="/admin/settings" className="font-semibold text-blue underline-offset-2 hover:underline">
              Open settings
            </Link>
          </Banner>
        )}
        {role === "support" && perm && !can(perm) && (
          <Banner tone="info" icon={<Lock className="size-5 text-blue" aria-hidden />} title="Read only for support">
            {DENIED[perm]}. You can view everything here.
          </Banner>
        )}
        {role === "admin" && perm && !can(perm) && (
          <Banner tone="info" icon={<Lock className="size-5 text-blue" aria-hidden />} title="Read only for admins">
            A super admin has limited this for admins in Team and roles. You can view everything here.
          </Banner>
        )}
      </div>
      {children}
    </div>
  )
}

// ------------------------------------------------------------------ reason dialog

export interface ReasonDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel: string
  destructive?: boolean
  presets?: string[]
  /** Extra fields above the reason box. */
  children?: React.ReactNode
  /** Extra validation for the extra fields; return an error message to block. */
  validate?: () => string | null
  onConfirm: (reason: string) => void
  defaultReason?: string
}

/** Every admin write asks for a reason, which lands in the audit log (A-22). */
export function ReasonDialog({ open, onOpenChange, title, description, confirmLabel, destructive, presets, children, validate, onConfirm, defaultReason = "" }: ReasonDialogProps) {
  const [reason, setReason] = React.useState(defaultReason)
  const [error, setError] = React.useState<string | null>(null)
  const id = React.useId()
  const change = (v: boolean) => {
    if (v) {
      setReason(defaultReason)
      setError(null)
    }
    onOpenChange(v)
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const extra = validate?.()
    if (extra) return setError(extra)
    if (reason.trim().length < 3) return setError("Add a reason. It goes in the audit log.")
    onConfirm(reason.trim())
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="shadow-overlay sm:max-w-[480px] rounded-2xl p-6">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[19px] font-semibold leading-[26px] text-navy">{title}</DialogTitle>
            {description && <DialogDescription className="t-label font-normal text-slate">{description}</DialogDescription>}
          </DialogHeader>
          {children}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-reason`} className="t-label text-navy">
              Reason
            </label>
            {presets && presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common reasons">
                {presets.map((p) => (
                  <button key={p} type="button" onClick={() => setReason(p)} aria-pressed={reason === p} className={cn("min-h-9 rounded-full border px-3 t-caption", reason === p ? "border-blue bg-blue-tint text-blue" : "border-line text-navy hover:border-blue/50")}>
                    {p}
                  </button>
                ))}
              </div>
            )}
            <textarea
              id={`${id}-reason`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
              rows={3}
              placeholder="Why are you doing this? Recorded in the audit log."
              aria-invalid={!!error || undefined}
              className="w-full rounded-[12px] border border-line bg-white px-3 py-2.5 text-[14px] text-navy outline-none placeholder:text-muted-ink focus:border-blue focus:ring-3 focus:ring-blue/20 aria-invalid:border-red"
            />
            {error && (
              <p role="alert" className="t-caption text-red">
                {error}
              </p>
            )}
            <p className="t-caption text-muted-ink">Recorded in the audit log with your name and the time.</p>
          </div>
          <DialogFooter className="-mx-6 -mb-6 rounded-b-2xl bg-sky px-6 py-4">
            <Button variant="secondary" size="md" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={destructive ? "destructive" : "primary"} size="md">
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** A button that checks permission, then opens a reason dialog. Disabled buttons say why. */
export function ReasonButton({
  label,
  perm,
  variant = "secondary",
  size = "sm",
  className,
  icon,
  showDenied = false,
  disabled,
  ...dialog
}: Omit<ReasonDialogProps, "open" | "onOpenChange" | "confirmLabel"> & {
  label: string
  confirmLabel?: string
  perm: AdminPerm
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "tint"
  size?: "sm" | "md"
  className?: string
  icon?: React.ReactNode
  /** Show the "Support can't …" line under the button. */
  showDenied?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const can = useCan()
  const denied = useDenied()
  const allowed = can(perm)
  const deniedId = React.useId()
  return (
    <span className="inline-flex flex-col items-start">
      <Button
        variant={variant}
        size={size}
        className={cn(size === "sm" && "h-10", className)}
        disabled={!allowed || disabled}
        title={!allowed ? denied(perm) : undefined}
        aria-describedby={!allowed ? deniedId : undefined}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        {icon}
        {label}
      </Button>
      {!allowed && (
        <span id={deniedId} className={cn("t-caption text-muted-ink", !showDenied && "sr-only")}>
          {denied(perm)}
        </span>
      )}
      <ReasonDialog open={open} onOpenChange={setOpen} confirmLabel={dialog.confirmLabel ?? label} {...dialog} />
    </span>
  )
}

// ------------------------------------------------------------------ small pieces

export function Panel({ title, action, children, className, id }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white", className)} aria-labelledby={id}>
      {(title || action) && (
        <div className="flex min-h-12 items-center gap-3 border-b border-line px-4 py-2">
          {title && (
            <h2 id={id} className="min-w-0 flex-1 text-[15px] font-semibold text-navy">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Kpi({ label, value, sub, href, tone = "plain" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string; tone?: "plain" | "warn" | "bad" }) {
  const cls = cn(
    "group flex min-h-[104px] flex-col rounded-2xl border bg-white p-4 shadow-card transition-colors",
    href && "hover:border-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
    tone === "warn" ? "border-amber" : tone === "bad" ? "border-red" : "border-line",
  )
  const body = (
    <>
      <span className="t-caption text-muted-ink">{label}</span>
      <span className="mt-1 text-[26px] font-bold leading-8 text-navy tnum">{value}</span>
      {sub && <span className="mt-auto pt-1 t-caption text-slate">{sub}</span>}
    </>
  )
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export function Pill({ tone = "plain", children, icon }: { tone?: "plain" | "good" | "warn" | "bad" | "info" | "navy"; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium [&_svg]:size-3.5",
        tone === "plain" && "border border-line bg-white text-slate",
        tone === "good" && "bg-teal-tint text-teal-ink",
        tone === "warn" && "bg-amber-tint text-amber-ink",
        tone === "bad" && "bg-red-tint text-red",
        tone === "info" && "bg-blue-tint text-blue",
        tone === "navy" && "bg-navy text-white",
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export function KeyValues({ rows, className }: { rows: [React.ReactNode, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[minmax(120px,auto)_1fr] gap-x-4 gap-y-2 text-[14px]", className)}>
      {rows.map(([k, v], i) => (
        <React.Fragment key={i}>
          <dt className="text-muted-ink">{k}</dt>
          <dd className="min-w-0 break-words text-navy">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

/** S-01 to S-10 for anyone but the super admin. */
export function NoSuperAccess({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line py-16 text-center" role="status">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-amber-tint">
        <Crown className="size-8 text-amber-ink" aria-hidden />
      </span>
      <h1 className="mt-4 t-heading">Super admin only</h1>
      <p className="mt-1 max-w-md t-body text-slate">{title} is for Vitalos leadership. Ask a super admin if you need something changed here.</p>
      <ButtonLink href="/admin" size="md" className="mt-5">
        Back to overview
      </ButtonLink>
    </div>
  )
}

export function NoAccess() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <ShieldAlert className="size-10 text-red" aria-hidden />
      <h2 className="mt-3 t-heading">Not available</h2>
      <p className="mt-1 t-body text-slate">This record doesn&apos;t exist or was merged.</p>
      <ButtonLink href="/admin" size="md" className="mt-5">
        Back to overview
      </ButtonLink>
    </div>
  )
}

/** Small admin input styles (inputs stay 44 high for touch). */
export const adminInput =
  "h-11 w-full rounded-[12px] border border-line bg-white px-3 text-[14px] text-navy outline-none placeholder:text-muted-ink focus:border-blue focus:ring-3 focus:ring-blue/20 disabled:bg-sky disabled:text-muted-ink aria-invalid:border-red"

export function userName(users: { id: string; firstName: string; lastName: string }[], id: string | null | undefined) {
  const u = users.find((x) => x.id === id)
  return u ? `${u.firstName} ${u.lastName}`.trim() : id === "system" ? "System" : "Unknown"
}

/** Browser download of a text file (CSV, JSON). */
export function download(name: string, body: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([body], { type }))
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
}
