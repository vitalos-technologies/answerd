"use client"
import * as React from "react"
import { Construction, RefreshCw, WifiOff } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Banner, ErrorState, OfflineBanner } from "@/components/answerd/Feedback"
import { Button } from "@/components/answerd/Button"
import { ChatBubble } from "@/components/answerd/Chat"
import { Mark } from "@/components/brand/Mark"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={title} className="space-y-2">
      <h2 id={title} className="t-subhead">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-sky">{children}</div>
    </section>
  )
}

/** C-48: gallery of offline, retry, error and maintenance states. */
export default function StatesPage() {
  const offline = useStore((s) => s.offline)
  const setOffline = useStore((s) => s.setOffline)
  return (
    <AppScreen id="C-48" header={<TopBar title="Offline and errors" back />}>
      <div className="space-y-6 p-4">
        <Banner tone="info" title={offline ? "You're offline (demo)" : "Try it live"} action={<Button size="sm" variant="secondary" onClick={() => setOffline(!offline)}>{offline ? "Go back online" : "Go offline"}</Button>}>
          The hub&apos;s Go offline switch shows the banner on every app screen and queues messages with a clock icon.
        </Banner>

        <Frame title="Offline banner">
          <OfflineBanner />
          <div className="space-y-2 p-3">
            <ChatBubble author="customer" queued>
              Can you come Thursday?
            </ChatBubble>
          </div>
        </Frame>

        <Frame title="Retry card">
          <div className="p-3">
            <div className="card flex items-center gap-3 p-4">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-amber-tint text-amber-ink">
                <WifiOff className="size-5" aria-hidden />
              </span>
              <div className="flex-1">
                <p className="t-label text-navy">Couldn&apos;t load results</p>
                <p className="t-caption text-muted-ink">Check your connection, then try again.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => toast("Retrying…")}>
                <RefreshCw /> Retry
              </Button>
            </div>
          </div>
        </Frame>

        <Frame title="Something went wrong">
          <div className="bg-white">
            <ErrorState onRetry={() => window.location.reload()} />
          </div>
        </Frame>

        <Frame title="Maintenance">
          <div className="flex flex-col items-center bg-white px-6 py-10 text-center">
            <span className="relative inline-flex size-20 items-center justify-center rounded-full bg-blue-tint">
              <Mark size={44} />
              <span className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full bg-amber text-navy">
                <Construction className="size-4" aria-hidden />
              </span>
            </span>
            <h3 className="t-heading mt-4">We&apos;re making Answerd better</h3>
            <p className="mt-1 t-body text-slate">We&apos;ll be back by 6am. Calls to businesses still work as normal.</p>
            <Button className="mt-5" variant="secondary" size="md" onClick={() => window.location.reload()}>
              <RefreshCw /> Try again
            </Button>
          </div>
        </Frame>
      </div>
    </AppScreen>
  )
}
