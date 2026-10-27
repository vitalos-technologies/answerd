"use client"
// Hub: which data the prototype is running on. Mock mode is the default; API mode is on when
// NEXT_PUBLIC_ANSWERD_API_URL is set at build time.
import { Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { useApiStatus } from "@/lib/api/status"
import { BRIDGE_ROUTES } from "@/lib/api/bridge"
import { syncCatalogue } from "@/lib/api/catalogue"
import { cn } from "@/lib/utils"

const host = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/** The pill in the hub header: "Mock data" or "API: <host>". */
export function DataSourceBadge() {
  const mode = useApiStatus((s) => s.mode)
  const url = useApiStatus((s) => s.url)
  return (
    <span data-testid="data-source" data-mode={mode} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 t-label", mode === "api" ? "bg-teal-tint text-teal-ink" : "bg-amber-tint text-amber-ink")}>
      <Database className="size-3.5" aria-hidden />
      {mode === "api" ? `API: ${host(url)}` : "Mock data"}
    </span>
  )
}

export function DataSourcePanel() {
  const s = useApiStatus()
  if (s.mode === "mock")
    return (
      <p className="t-label font-normal text-slate">
        Every surface runs on the demo store in this browser. To use the real API, build with <code className="rounded bg-sky px-1">NEXT_PUBLIC_ANSWERD_API_URL</code> set, for example to staging.
      </p>
    )
  const local = Object.entries(s.localOnly).sort((x, y) => y[1] - x[1])
  return (
    <div className="space-y-3" aria-live="polite">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 t-label">
        <dt className="text-muted-ink">API</dt>
        <dd className="break-all text-navy">{s.url}</dd>
        <dt className="text-muted-ink">Catalogue</dt>
        <dd className="text-navy" data-testid="api-sync" data-state={s.sync.state}>
          {s.sync.state === "running" ? "Syncing (staging can take a minute to wake)…" : s.sync.state === "done" ? `${s.sync.listings} listings from the API` : s.sync.state === "error" ? `Sync failed: ${s.sync.error}` : "Not synced yet"}
        </dd>
        <dt className="text-muted-ink">Signed in</dt>
        <dd className="text-navy">{s.user ? `${s.user.phone}${s.user.name ? ` (${s.user.name})` : ""}` : "No API session (personas are demo-only)"}</dd>
        <dt className="text-muted-ink">Realtime</dt>
        <dd className="text-navy">{s.realtime}</dd>
        <dt className="text-muted-ink">Actions</dt>
        <dd className="text-navy">{BRIDGE_ROUTES.length} store actions call the API</dd>
      </dl>
      <Button size="sm" variant="secondary" onClick={() => void syncCatalogue(true)} disabled={s.sync.state === "running"}>
        <RefreshCw className="size-4" aria-hidden /> Sync catalogue now
      </Button>
      {s.calls.length > 0 && (
        <div>
          <p className="t-caption text-muted-ink">Latest API calls</p>
          <ol className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line bg-sky p-2 font-mono text-[12px] leading-4">
            {s.calls.slice(0, 20).map((c, i) => (
              <li key={i} className={cn(typeof c.status === "number" && c.status < 400 ? "text-slate" : "text-red")}>
                {c.status} {c.method} {c.path}
                {c.action ? ` ← ${c.action}` : ""} · {c.ms} ms
              </li>
            ))}
          </ol>
        </div>
      )}
      {local.length > 0 && (
        <p className="t-caption text-muted-ink">
          Local only (no endpoint yet, or mock data with no API id): {local.map(([k, n]) => `${k} ×${n}`).join(", ")}
        </p>
      )}
      {s.events.length > 0 && <p className="t-caption text-muted-ink">Realtime events: {s.events.map((e) => e.type).join(", ")}</p>}
    </div>
  )
}
