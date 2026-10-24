"use client"
import Link from "next/link"
import { CalendarClock, MessageSquare, Phone, PhoneMissed, Smartphone } from "lucide-react"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/answerd/Badges"
import { Chip } from "@/components/answerd/Fields"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { fmtAgo } from "@/lib/time"
import { cn } from "@/lib/utils"
import { inboxItems, type InboxFilter, type InboxItem } from "./data"
import { useOpsLinks } from "./links"

export const INBOX_FILTERS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "needs", label: "Needs you" },
  { value: "desk", label: "Desk handled" },
  { value: "calls", label: "Calls" },
  { value: "requests", label: "Booking requests" },
]

const EMPTY: Record<InboxFilter, { title: string; body: string }> = {
  all: { title: "No conversations yet", body: "Calls, texts and app messages from customers land here." },
  needs: { title: "Nothing needs you", body: "Handoffs from the desk and booking requests show here." },
  desk: { title: "Nothing handled by the desk", body: "Conversations the AI desk answered show here." },
  calls: { title: "No calls yet", body: "Calls to your Answerd number show here with a summary." },
  requests: { title: "No booking requests", body: "Requests to book wait here for you to accept." },
}

export function InboxFilters({ value, onChange, counts, className }: { value: InboxFilter; onChange: (f: InboxFilter) => void; counts?: Partial<Record<InboxFilter, number>>; className?: string }) {
  return (
    <div className={cn("no-scrollbar flex gap-2 overflow-x-auto", className)} role="radiogroup" aria-label="Filter the inbox">
      {INBOX_FILTERS.map((f) => (
        <Chip key={f.value} active={value === f.value} onClick={() => onChange(f.value)} role="radio" aria-checked={value === f.value} aria-pressed={undefined} className="h-11 shrink-0">
          {f.label}
          {!!counts?.[f.value] && <span className="ml-1 tnum">{counts[f.value]}</span>}
        </Chip>
      ))}
    </div>
  )
}

function ChannelIcon({ item }: { item: InboxItem }) {
  if (item.kind === "request") return <CalendarClock className="size-5" aria-label="Booking request" />
  if (item.channel === "call") return item.outcome === "missed" ? <PhoneMissed className="size-5" aria-label="Missed call" /> : <Phone className="size-5" aria-label="Call" />
  if (item.channel === "sms") return <MessageSquare className="size-5" aria-label="SMS" />
  return <Smartphone className="size-5" aria-label="App message" />
}

/** B-19 rows: channel icon, customer, summary, time and a Desk tag. Rows open B-20, B-21, B-22 or B-24. */
export function InboxList({ listingId, filter, selectedKey, onSelect, className }: { listingId: string; filter: InboxFilter; selectedKey?: string; onSelect?: (item: InboxItem) => void; className?: string }) {
  const s = useStore()
  const links = useOpsLinks()
  const items = inboxItems(s, listingId, filter)
  const href = (i: InboxItem) => (i.link === "thread" ? links.thread(i.linkId) : i.link === "call" ? links.call(i.linkId) : i.link === "request" ? links.request(i.linkId) : links.job(i.linkId))
  return (
    <DataGate isEmpty={!items.length} empty={<EmptyState title={EMPTY[filter].title} body={EMPTY[filter].body} />}>
      <ul className={cn("card divide-y divide-line overflow-hidden", className)}>
        {items.map((i) => (
          <li key={i.key}>
            <Link
              href={href(i)}
              onClick={onSelect ? (e) => (e.preventDefault(), onSelect(i)) : undefined}
              aria-current={selectedKey === i.key ? "true" : undefined}
              className={cn("flex min-h-[72px] items-start gap-3 px-4 py-3 hover:bg-sky", selectedKey === i.key && "bg-blue-tint")}
            >
              <span className={cn("mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full", i.needs ? "bg-red-tint text-red" : i.kind === "request" ? "bg-amber-tint text-amber-ink" : "bg-sky text-navy")}>
                <ChannelIcon item={i} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={cn("min-w-0 flex-1 truncate t-label text-navy", i.unread && "font-semibold")}>{i.name}</span>
                  <span className="shrink-0 t-caption text-muted-ink tnum">{fmtAgo(i.at, s.clock)}</span>
                </span>
                <span className={cn("mt-0.5 line-clamp-2 t-caption", i.unread ? "text-navy" : "text-muted-ink")}>{i.summary}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  {i.desk && <Badge kind="desk" />}
                  {i.needs && <span className="inline-flex h-5 items-center rounded-full bg-red-tint px-2 t-caption text-red">Needs you</span>}
                  {i.spam && <span className="inline-flex h-5 items-center rounded-full bg-sky px-2 t-caption text-muted-ink">Spam</span>}
                  {i.unread && <span className="size-2 rounded-full bg-blue" aria-label="Unread" />}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </DataGate>
  )
}
