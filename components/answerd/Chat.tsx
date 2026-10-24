"use client"
import * as React from "react"
import { CalendarCheck, Clock, FileText } from "lucide-react"
import type { BookingStatus, MessageAuthor, QuoteLine } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DeskAvatar, PersonAvatar } from "./Media"
import { Button } from "./Button"
import { StatusPill } from "./Status"
import { fmtDate, fmtTime, fmtDateTime } from "@/lib/time"
import { gbp } from "@/lib/format"

/**
 * Customer: blue, white text, right. Business human: white with border, left, initials.
 * AI desk: teal-tint, left, mark avatar, "Answerd desk" above the first bubble of each turn.
 */
export function ChatBubble({
  author,
  authorName,
  children,
  time,
  showLabel = true,
  queued,
  card,
  viewer = "customer",
}: {
  author: MessageAuthor
  authorName?: string
  children?: React.ReactNode
  time?: string
  showLabel?: boolean
  queued?: boolean
  card?: React.ReactNode
  viewer?: "customer" | "business"
}) {
  if (author === "system") {
    return (
      <div className="my-2 flex flex-col items-center gap-2">
        {children && <p className="rounded-full bg-white/80 px-3 py-1 text-center t-caption text-muted-ink border border-line">{children}</p>}
        {card && <div className="w-full max-w-[300px]">{card}</div>}
      </div>
    )
  }
  const mine = viewer === "customer" ? author === "customer" : author === "owner" || author === "staff"
  const isDesk = author === "desk"
  return (
    <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
      {!mine && (isDesk ? <DeskAvatar size={28} /> : author === "customer" ? <PersonAvatar name={authorName ?? "Customer"} size={28} tone="blue" /> : <PersonAvatar name={authorName ?? "Owner"} size={28} />)}
      <div className={cn("flex max-w-[78%] flex-col gap-1.5", mine ? "items-end" : "items-start")}>
        {!mine && showLabel && (
          <span className={cn("px-1 t-caption", isDesk ? "text-teal-ink" : "text-muted-ink")}>
            {isDesk ? "Answerd desk" : author === "staff" ? `${authorName ?? "Staff"} · staff` : authorName}
          </span>
        )}
        {children && (
          <div
            className={cn(
              "whitespace-pre-line rounded-2xl px-3.5 py-2.5 t-body",
              mine && (viewer === "customer" ? "rounded-br-md bg-blue text-white" : "rounded-br-md bg-navy text-white"),
              !mine && isDesk && "rounded-bl-md bg-teal-tint text-navy",
              !mine && !isDesk && author !== "customer" && "rounded-bl-md border border-line bg-white text-navy",
              !mine && author === "customer" && "rounded-bl-md bg-blue-tint text-navy",
            )}
          >
            {children}
          </div>
        )}
        {card}
        {(time || queued) && (
          <span className="inline-flex items-center gap-1 px-1 text-[11px] leading-4 text-muted-ink tnum">
            {queued && <Clock className="size-3" aria-label="Queued, will send when you're back online" />}
            {queued ? "Waiting to send" : time}
          </span>
        )}
      </div>
    </div>
  )
}

export function TypingIndicator({ label = "Answerd desk is replying…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2" role="status">
      <DeskAvatar size={28} />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-teal-tint px-3.5 py-2.5">
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 animate-bounce rounded-full bg-teal-ink" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </span>
        <span className="t-caption text-teal-ink">{label}</span>
      </div>
    </div>
  )
}

export function SlotCard({ slots, serviceName, onPick, disabled }: { slots: string[]; serviceName?: string; onPick?: (slot: string) => void; disabled?: boolean }) {
  return (
    <div className="w-full min-w-[240px] rounded-2xl border border-line bg-white p-3 shadow-card">
      <p className="flex items-center gap-1.5 t-caption text-muted-ink">
        <CalendarCheck className="size-4 text-blue" aria-hidden /> {serviceName ? `Free times · ${serviceName}` : "Free times"}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {slots.length ? (
          slots.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onPick?.(s)}
              className="flex h-11 items-center justify-between rounded-xl border border-line px-3 text-left t-label text-navy hover:border-blue hover:bg-blue-tint disabled:opacity-50"
            >
              <span>{fmtDate(s)}</span>
              <span className="tnum font-semibold text-blue">{fmtTime(s)}</span>
            </button>
          ))
        ) : (
          <p className="t-caption text-slate">No free times in the next two weeks.</p>
        )}
      </div>
    </div>
  )
}

export function QuoteCard({
  lines,
  totalPence,
  vatPence,
  vatIncluded,
  validUntil,
  status,
  onAccept,
  onDecline,
  canRespond,
}: {
  lines: QuoteLine[]
  totalPence: number
  vatPence: number
  vatIncluded: boolean
  validUntil: string
  status: "sent" | "accepted" | "declined" | "expired"
  onAccept?: () => void
  onDecline?: () => void
  canRespond?: boolean
}) {
  return (
    <div className="w-full min-w-[250px] rounded-2xl border border-line bg-white p-3.5 shadow-card">
      <p className="flex items-center gap-1.5 t-caption text-muted-ink">
        <FileText className="size-4 text-blue" aria-hidden /> Quote
      </p>
      <ul className="mt-2 space-y-1">
        {lines.map((l) => (
          <li key={l.id} className="flex justify-between gap-3 t-label font-normal text-slate">
            <span>{l.label}</span>
            <span className="tnum text-navy">{gbp(l.pricePence)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-3 t-caption text-muted-ink">
          <span>VAT {vatIncluded ? "(included)" : "(20%)"}</span>
          <span className="tnum">{gbp(vatPence)}</span>
        </li>
      </ul>
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
        <span className="t-label text-navy">Total inc VAT</span>
        <span className="t-subhead tnum">{gbp(totalPence)}</span>
      </div>
      <p className="mt-1 t-caption text-muted-ink">Valid until {fmtDate(validUntil)}</p>
      {status === "sent" && canRespond ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={onDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={onAccept}>
            Accept
          </Button>
        </div>
      ) : (
        <p className={cn("mt-2 t-caption", status === "accepted" ? "text-teal-ink" : status === "sent" ? "text-amber-ink" : "text-muted-ink")}>
          {status === "accepted" ? "Accepted" : status === "declined" ? "Declined" : status === "expired" ? "Expired" : "Waiting for the customer"}
        </p>
      )}
    </div>
  )
}

export function BookingCard({ service, startAt, status, priceText, onOpen }: { service: string; startAt: string; status: BookingStatus; priceText?: string; onOpen?: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="w-full min-w-[240px] rounded-2xl border border-line bg-white p-3.5 text-left shadow-card hover:border-blue">
      <div className="flex items-center justify-between gap-2">
        <span className="t-caption text-muted-ink">Booking</span>
        <StatusPill status={status} />
      </div>
      <p className="mt-1 t-subhead">{service}</p>
      <p className="t-label font-normal text-slate tnum">{fmtDateTime(startAt)}</p>
      {priceText && <p className="t-caption text-muted-ink">{priceText}</p>}
    </button>
  )
}
