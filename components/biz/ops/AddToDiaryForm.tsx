"use client"
import * as React from "react"
import { useStore } from "@/lib/store"
import { Banner } from "@/components/answerd/Feedback"
import { Button } from "@/components/answerd/Button"
import { Field, SelectInput, TextArea, TextInput } from "@/components/answerd/Fields"
import { SegmentedControl } from "@/components/answerd/Status"
import { serviceById, servicesFor } from "@/lib/selectors"
import { addMinutes, atMinutes, dayKey, fmtDateTime, fmtHM, fmtTime, minutesOfDay, ms } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { blocksOn } from "./Diary"

const TIMES = Array.from({ length: (21 - 6) * 2 }, (_, i) => 6 * 60 + i * 30)

function roundTo30(min: number) {
  return Math.min(20 * 60, Math.max(6 * 60, Math.round(min / 30) * 30))
}

/**
 * B-25: Booking (customer, service, time) or Block time (reason, repeat), with a clash warning.
 * `at` pre-fills the time tapped in the diary.
 */
export function AddToDiaryForm({ listingId, businessId, at, onSaved, className }: { listingId: string; businessId: string; at?: string; onSaved: (kind: "booking" | "block", day: string) => void; className?: string }) {
  const s = useStore()
  const start = at && !Number.isNaN(ms(at)) ? at : atMinutes(dayKey(s.clock), roundTo30(minutesOfDay(s.clock) + 60))
  const [kind, setKind] = React.useState<"booking" | "block">("booking")
  const [date, setDate] = React.useState(dayKey(start))
  const [time, setTime] = React.useState(roundTo30(minutesOfDay(start)))
  const services = servicesFor(s, businessId)
  const [serviceId, setServiceId] = React.useState(services.find((x) => x.bookable)?.id ?? services[0]?.id ?? "")
  // Known customers: from bookings and conversations with this business
  const known = React.useMemo(() => {
    const out = new Map<string, { key: string; customerId: string | null; name: string; phone: string; address: string; postcode: string }>()
    for (const b of [...s.bookings].filter((x) => x.listingId === listingId).sort((a, c) => c.createdAt.localeCompare(a.createdAt))) {
      const key = b.customerId ?? `name:${b.customerName}`
      if (!out.has(key)) out.set(key, { key, customerId: b.customerId, name: b.customerName, phone: b.customerPhone, address: b.address, postcode: b.postcode })
    }
    for (const t of s.threads.filter((x) => x.listingId === listingId && !x.spam)) {
      const key = t.customerId ?? `name:${t.customerName}`
      if (!out.has(key)) out.set(key, { key, customerId: t.customerId, name: t.customerName, phone: t.customerPhone ?? s.users.find((u) => u.id === t.customerId)?.phone ?? "", address: "", postcode: "" })
    }
    return [...out.values()]
  }, [s.bookings, s.threads, s.users, listingId])
  const [custKey, setCustKey] = React.useState(known[0]?.key ?? "new")
  const cust = known.find((k) => k.key === custKey)
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [address, setAddress] = React.useState(cust?.address ?? "")
  const [postcode, setPostcode] = React.useState(cust?.postcode ?? "")
  const [notes, setNotes] = React.useState("")
  const members = s.members.filter((m) => m.businessId === businessId && m.userId && m.joinedAt)
  const [assignee, setAssignee] = React.useState(s.session.userId ?? "")
  const [reason, setReason] = React.useState("")
  const [endTime, setEndTime] = React.useState(roundTo30(minutesOfDay(start)) + 60)
  const [repeat, setRepeat] = React.useState<"none" | "daily" | "weekly">("none")
  const [tried, setTried] = React.useState(false)

  const svc = serviceById(s, serviceId)
  const startAt = atMinutes(date, time)
  const endAt = kind === "booking" ? addMinutes(startAt, svc?.durationMin ?? 60) : atMinutes(date, endTime)
  const clashJobs = s.bookings.filter((b) => b.listingId === listingId && ["requested", "confirmed", "on_the_way", "arrived"].includes(b.status) && ms(b.startAt) < ms(endAt) && ms(startAt) < ms(b.endAt))
  const endMin = kind === "booking" ? time + (svc?.durationMin ?? 60) : endTime
  const clashBlocks = blocksOn(s.blocks, businessId, date).filter((b) => b.start < endMin && time < b.end)
  const clash = clashJobs.length + clashBlocks.length > 0
  const past = ms(startAt) < ms(s.clock)

  const custName = custKey === "new" ? name.trim() : cust?.name ?? ""
  const errs = {
    name: kind === "booking" && custKey === "new" && !name.trim() ? "Add the customer's name" : undefined,
    address: kind === "booking" && !address.trim() ? "Add the job address" : undefined,
    reason: kind === "block" && !reason.trim() ? "Say why, e.g. Merchant pick-up" : undefined,
    end: kind === "block" && endTime <= time ? "End must be after the start" : undefined,
  }
  const valid = !Object.values(errs).some(Boolean) && !!date

  const save = () => {
    setTried(true)
    if (!valid) return
    if (kind === "booking") {
      const r = s.createBooking({
        listingId,
        serviceId,
        startAt,
        address: address.trim(),
        postcode: postcode.trim().toUpperCase(),
        notes: notes.trim(),
        createdBy: "owner",
        customerName: custName,
        customerId: custKey === "new" ? null : cust?.customerId ?? null,
        contactPhone: custKey === "new" ? phone.trim() : cust?.phone ?? "",
      })
      if (r.ok && assignee) s.assignBooking(r.bookingId, assignee)
      toast(`Booked: ${svc?.name ?? "job"} for ${custName}, ${fmtDateTime(startAt)}`)
    } else {
      s.addBlock(businessId, startAt, endAt, reason.trim(), repeat)
      toast(`Blocked ${fmtTime(startAt)} to ${fmtTime(endAt)}`)
    }
    onSaved(kind, date)
  }

  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <SegmentedControl
        label="What to add"
        value={kind}
        onChange={(k) => (setKind(k), setTried(false))}
        options={[
          { value: "booking", label: "Booking" },
          { value: "block", label: "Block time" },
        ]}
      />

      {kind === "booking" ? (
        <>
          <Field label="Customer" htmlFor="ad-cust">
            <SelectInput
              id="ad-cust"
              value={custKey}
              onChange={(e) => {
                setCustKey(e.target.value)
                const k = known.find((x) => x.key === e.target.value)
                setAddress(k?.address ?? "")
                setPostcode(k?.postcode ?? "")
              }}
            >
              {known.map((k) => (
                <option key={k.key} value={k.key}>
                  {k.name}
                </option>
              ))}
              <option value="new">New customer…</option>
            </SelectInput>
          </Field>
          {custKey === "new" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" htmlFor="ad-name" error={tried ? errs.name : undefined}>
                <TextInput id="ad-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" aria-invalid={(tried && !!errs.name) || undefined} />
              </Field>
              <Field label="Mobile" htmlFor="ad-phone" optional>
                <TextInput id="ad-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900000" />
              </Field>
            </div>
          )}
          <Field label="Service" htmlFor="ad-svc" hint={svc ? `${svc.durationMin} min` : undefined}>
            <SelectInput id="ad-svc" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </>
      ) : (
        <Field label="Reason" htmlFor="ad-reason" error={tried ? errs.reason : undefined}>
          <TextInput id="ad-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Merchant pick-up, dentist" aria-invalid={(tried && !!errs.reason) || undefined} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="ad-date">
          <TextInput id="ad-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={kind === "booking" ? "Start" : "From"} htmlFor="ad-time">
          <SelectInput id="ad-time" value={time} onChange={(e) => setTime(Number(e.target.value))}>
            {TIMES.map((m) => (
              <option key={m} value={m}>
                {fmtHM(Math.floor(m / 60), m % 60)}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      {kind === "block" ? (
        <>
          <Field label="To" htmlFor="ad-end" error={tried ? errs.end : undefined}>
            <SelectInput id="ad-end" value={endTime} onChange={(e) => setEndTime(Number(e.target.value))}>
              {TIMES.filter((m) => m > time).map((m) => (
                <option key={m} value={m}>
                  {fmtHM(Math.floor(m / 60), m % 60)}
                </option>
              ))}
              <option value={21 * 60}>9pm</option>
            </SelectInput>
          </Field>
          <div>
            <p className="mb-1.5 t-label text-navy">Repeat</p>
            <SegmentedControl
              label="Repeat"
              value={repeat}
              onChange={setRepeat}
              options={[
                { value: "none", label: "Never" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
              ]}
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Address" htmlFor="ad-addr" error={tried ? errs.address : undefined}>
              <TextInput id="ad-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 Elm Rd, London" aria-invalid={(tried && !!errs.address) || undefined} />
            </Field>
            <Field label="Postcode" htmlFor="ad-pc">
              <TextInput id="ad-pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SE25 4AA" className="uppercase" />
            </Field>
          </div>
          {members.length > 1 && (
            <Field label="Who's doing it" htmlFor="ad-who">
              <SelectInput id="ad-who" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {members.map((m) => (
                  <option key={m.id} value={m.userId!}>
                    {m.name}
                    {m.role === "staff" ? " (staff)" : ""}
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}
          <Field label="Notes" htmlFor="ad-notes" optional>
            <TextArea id="ad-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember" />
          </Field>
          {custKey !== "new" && cust?.customerId && <p className="t-caption text-muted-ink">{cust.name.split(" ")[0]} gets a confirmation on Answerd.</p>}
        </>
      )}

      {clash && (
        <Banner tone="warning" title="This clashes with your diary">
          {[...clashJobs.map((b) => `${serviceById(s, b.serviceId)?.name ?? "Job"} for ${b.customerName} at ${fmtTime(b.startAt)}`), ...clashBlocks.map((b) => `Blocked: ${b.reason}`)].join(". ")}. You can still save it.
        </Banner>
      )}
      {past && <Banner tone="info" title="This time has passed">You can still add it to keep your records straight.</Banner>}

      <Button type="submit" block>
        {clash ? "Save anyway" : kind === "booking" ? "Add booking" : "Block time"}
      </Button>
    </form>
  )
}
