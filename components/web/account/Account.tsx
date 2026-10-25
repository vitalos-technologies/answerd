"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, ChevronRight, Heart, LogOut, MessageCircle, Smartphone, Star } from "lucide-react"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { StatusPill } from "@/components/answerd/Status"
import { ListingAvatar } from "@/components/answerd/Media"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { membershipsFor, serviceById } from "@/lib/selectors"
import { fmtDate, fmtRelDay, fmtTime, ms } from "@/lib/time"
import { Container } from "../ui"
import { reviewTokenState } from "../review/token"

/** The simple customer account page W-12 lands on: bookings, messages, saved and a way into business mode. */
export function Account() {
  const s = useStore()
  const router = useRouter()
  const user = s.users.find((u) => u.id === s.session.userId)
  if (!s.hydrated) return <Container className="py-16" aria-busy="true"><p className="t-body text-slate">Loading…</p></Container>
  if (!user) {
    return (
      <Container className="py-16">
        <div className="card mx-auto max-w-md">
          <EmptyState title="Sign in to see your account" body="Your bookings, messages and saved businesses live here." action={<ButtonLink href="/sign-in?next=%2Faccount" size="md">Sign in</ButtonLink>} />
        </div>
      </Container>
    )
  }
  const mine = s.bookings.filter((b) => b.customerId === user.id)
  const upcoming = mine.filter((b) => ["requested", "confirmed", "on_the_way", "arrived"].includes(b.status) && ms(b.endAt) >= ms(s.clock)).sort((a, b) => a.startAt.localeCompare(b.startAt))
  const past = mine.filter((b) => !upcoming.includes(b)).sort((a, b) => b.startAt.localeCompare(a.startAt))
  const threads = s.threads.filter((t) => t.customerId === user.id && t.channel === "app").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const profile = s.customerProfiles.find((p) => p.userId === user.id)
  const saved = (profile?.savedListingIds ?? []).map((id) => s.listings.find((l) => l.id === id)).filter((l) => !!l)
  const isBiz = membershipsFor(s, user.id).length > 0
  const bookingRow = (b: (typeof mine)[number]) => {
    const l = s.listings.find((x) => x.id === b.listingId)
    const svc = serviceById(s, b.serviceId)
    const review = reviewTokenState(s, b.id)
    return (
      <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
        {l && <ListingAvatar listing={l} size={44} />}
        <div className="min-w-0 flex-1">
          <p className="truncate t-label text-navy">
            {svc?.name ?? "Booking"} · {l ? <Link href={`/b/${l.slug}`} className="hover:underline">{l.name}</Link> : null}
          </p>
          <p className="t-caption text-muted-ink tnum">
            {fmtDate(b.startAt)}, {fmtTime(b.startAt)} · {b.priceText}
          </p>
        </div>
        <StatusPill status={b.status} />
        {review === "valid" ? (
          <ButtonLink href={`/review/${b.id}`} size="sm" variant="tint">
            <Star /> Review
          </ButtonLink>
        ) : (
          <Link href={`/app/bookings/${b.id}`} className="inline-flex min-h-11 items-center gap-1 t-label text-blue hover:underline" aria-label={`Manage ${svc?.name ?? "booking"} in the app`}>
            Manage <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </li>
    )
  }

  return (
    <Container className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-title">Hi, {user.firstName}</h1>
          <p className="mt-1 t-label font-normal text-slate tnum">
            {user.firstName} {user.lastName}
            {user.phone ? ` · ${user.phone}` : ""}
            {user.email ? ` · ${user.email}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/app/account" variant="secondary" size="md">
            <Smartphone /> Account settings in the app
          </ButtonLink>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              s.signOut()
              router.push("/")
            }}
          >
            <LogOut /> Sign out
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <section className="card p-5" aria-labelledby="up-h">
            <h2 id="up-h" className="t-heading">
              Upcoming bookings
            </h2>
            <DataGate isEmpty={!upcoming.length} rows={2} empty={<EmptyState className="py-6" title="No bookings yet" body="Find a local business and book in a few taps." action={<ButtonLink href="/search" size="md">Find a service</ButtonLink>} />}>
              <ul className="mt-2 divide-y divide-line">{upcoming.map(bookingRow)}</ul>
            </DataGate>
          </section>
          <section className="card p-5" aria-labelledby="past-h">
            <h2 id="past-h" className="t-heading">
              Past bookings
            </h2>
            <DataGate isEmpty={!past.length} rows={2} empty={<p className="mt-2 t-body text-slate">Nothing here yet.</p>}>
              <ul className="mt-2 divide-y divide-line">{past.map(bookingRow)}</ul>
            </DataGate>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="card p-5" aria-labelledby="msg-h">
            <h2 id="msg-h" className="t-subhead">
              Messages
            </h2>
            <DataGate isEmpty={!threads.length} rows={2} empty={<p className="mt-2 t-label font-normal text-slate">Message a business and replies land here.</p>}>
              <ul className="mt-2">
                {threads.slice(0, 6).map((t) => {
                  const l = s.listings.find((x) => x.id === t.listingId)
                  const last = s.messages.filter((m) => m.threadId === t.id).at(-1)
                  if (!l) return null
                  return (
                    <li key={t.id}>
                      <Link href={`/b/${l.slug}?message=1`} className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 hover:bg-sky">
                        <MessageCircle className="size-5 shrink-0 text-blue" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate t-label text-navy">{l.name}</span>
                          <span className="block truncate t-caption text-muted-ink">{last?.body ?? "No messages yet"}</span>
                        </span>
                        <span className="shrink-0 t-caption text-muted-ink">{fmtRelDay(t.updatedAt, s.clock)}</span>
                        {t.unreadCustomer > 0 && <span className="size-2.5 rounded-full bg-blue" aria-label="Unread" />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </DataGate>
          </section>
          <section className="card p-5" aria-labelledby="saved-h">
            <h2 id="saved-h" className="t-subhead">
              Saved
            </h2>
            {saved.length ? (
              <ul className="mt-2">
                {saved.map((l) => (
                  <li key={l!.id}>
                    <Link href={`/b/${l!.slug}`} className="flex min-h-12 items-center gap-3 rounded-xl px-2 hover:bg-sky">
                      <Heart className="size-4 fill-red text-red" aria-hidden />
                      <span className="flex-1 truncate t-label text-navy">{l!.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 t-label font-normal text-slate">Tap the heart on a business to save it.</p>
            )}
          </section>
          <section className="card p-5">
            <div className="flex items-start gap-3">
              <Briefcase className="mt-0.5 size-5 text-blue" aria-hidden />
              <div>
                <p className="t-subhead">{isBiz ? "Your business" : "Run a business?"}</p>
                <p className="mt-1 t-label font-normal text-slate">{isBiz ? "Manage enquiries, your diary and the AI desk." : "List or claim your business free and see who's trying to reach you."}</p>
                <ButtonLink href={isBiz ? "/dashboard" : "/claim"} size="sm" className="mt-3" onClick={() => isBiz && s.setMode("business")}>
                  {isBiz ? "Go to dashboard" : "List or claim your business"}
                </ButtonLink>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </Container>
  )
}
