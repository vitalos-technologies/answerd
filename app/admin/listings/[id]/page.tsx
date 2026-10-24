"use client"
import * as React from "react"
import Link from "next/link"
import { use } from "react"
import { Building2, ExternalLink, FileText, GitMerge, MapPin, PenLine, Store } from "lucide-react"
import { AdminPage, KeyValues, NoAccess, Panel, Pill, ReasonButton, adminInput, useCan, DENIED, userName } from "@/components/admin/kit"
import { Banner } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { Stars } from "@/components/answerd/Rating"
import { useStore } from "@/lib/store"
import { businessForListing, listingRating } from "@/lib/selectors"
import { fmtDate, fmtDateYear, fmtTime } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { Listing, SourceRef } from "@/lib/types"

const SOURCE_LABEL: Record<SourceRef["source"], string> = { companies_house: "Companies House", osm: "OpenStreetMap", places: "Google Places", owner: "Owner edits" }

function EditListing({ listing }: { listing: Listing }) {
  const [name, setName] = React.useState(listing.name)
  const [phone, setPhone] = React.useState(listing.phonePublic)
  const [address, setAddress] = React.useState(listing.address)
  const [description, setDescription] = React.useState(listing.description)
  return (
    <ReasonButton
      perm="listings"
      label="Edit"
      icon={<PenLine aria-hidden />}
      size="md"
      title={`Edit ${listing.name}`}
      description="Changes show on the app and web straight away."
      confirmLabel="Save changes"
      presets={["Owner asked by phone", "Fix from Companies House data"]}
      validate={() => (name.trim().length < 2 ? "Enter a name." : null)}
      onConfirm={(reason) => {
        useStore.getState().adminDecide("listing", listing.id, "edit", reason, { patch: { name: name.trim(), phonePublic: phone.trim(), address: address.trim(), description: description.trim() } })
        toast("Listing saved")
      }}
    >
      <div className="grid gap-3">
        <label className="flex flex-col gap-1">
          <span className="t-label text-navy">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={adminInput} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label text-navy">Public phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={adminInput} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label text-navy">Address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={adminInput} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label text-navy">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${adminInput} h-auto py-2`} />
        </label>
      </div>
    </ReasonButton>
  )
}

/** A-04: fields by source, history, enquiries, reviews and documents; Edit, Suspend, Unpublish, Merge. */
export default function AdminListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const s = useStore()
  const can = useCan()
  const listing = s.listings.find((l) => l.id === id)
  if (!listing) {
    return (
      <AdminPage id="A-04" title="Listing" back={{ href: "/admin/listings", label: "Listings" }}>
        <NoAccess />
      </AdminPage>
    )
  }
  const survivor = listing.mergedInto ? s.listings.find((l) => l.id === listing.mergedInto) : undefined
  const biz = businessForListing(s, listing.id)
  const rating = listingRating(s, listing)
  const cat = (cid: string) => s.categories.find((c) => c.id === cid)
  const refs = (src: SourceRef["source"]) => listing.sourceRefs.filter((r) => r.source === src)
  const enquiries = s.enquiries.filter((e) => e.listingId === listing.id)
  const byKind = (k: string) => enquiries.filter((e) => e.kind === k).length
  const reviews = s.reviews.filter((r) => r.listingId === listing.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const claims = s.claims.filter((c) => c.listingId === listing.id)
  const creds = biz ? s.credentials.filter((c) => c.businessId === biz.id) : []
  const relatedIds = new Set([listing.id, biz?.id, ...claims.map((c) => c.id), ...creds.map((c) => c.id), ...reviews.map((r) => r.id)].filter(Boolean) as string[])
  const history = [
    { at: listing.createdAt, who: "System", what: `Listing created (${listing.layer === "places" ? "Places gap-fill" : listing.sourceRefs[0] ? SOURCE_LABEL[listing.sourceRefs[0].source] : "owner"})`, reason: "" },
    ...claims.map((c) => ({ at: c.createdAt, who: userName(s.users, c.userId), what: `Claim started by ${c.method}${c.status === "disputed" ? " (dispute)" : ""}`, reason: c.details ?? "" })),
    ...s.audit.filter((a) => relatedIds.has(a.targetId)).map((a) => ({ at: a.at, who: userName(s.users, a.actorId), what: a.action, reason: a.reason })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  const decide = (decision: string, msg: string) => (reason: string) => {
    useStore.getState().adminDecide("listing", listing.id, decision, reason)
    toast(msg)
  }

  return (
    <AdminPage
      id="A-04"
      title={listing.name}
      perm="listings"
      back={{ href: "/admin/listings", label: "Listings" }}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <Pill tone={listing.layer === "claimed" ? "good" : listing.layer === "seeded" ? "info" : "plain"}>{listing.layer}</Pill>
          {listing.badges.includes("verified") && <Pill tone="info">Verified</Pill>}
          <span>
            {listing.categoryIds.map((c) => cat(c)?.name ?? c).join(", ")} · {listing.postcodeDistrict}
          </span>
          <Link href={`/app/b/${listing.slug}`} className="inline-flex min-h-11 items-center gap-1 text-blue hover:underline">
            View in app <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </span>
      }
      actions={
        <>
          <EditListing key={`${listing.name}${listing.phonePublic}${listing.address}`} listing={listing} />
          {listing.suspended ? (
            <ReasonButton perm="listings" size="md" label="Unsuspend" title={`Unsuspend ${listing.name}?`} description="It returns to search, the app and the web." onConfirm={decide("unsuspend", "Listing unsuspended")} />
          ) : (
            <ReasonButton perm="listings" size="md" variant="destructive" label="Suspend" title={`Suspend ${listing.name}?`} description="It disappears from search, the app and the web until you unsuspend it." presets={["Business closed", "Fraud check", "Repeated complaints"]} onConfirm={decide("suspend", "Listing suspended")} />
          )}
          {listing.unpublished ? (
            <ReasonButton perm="listings" size="md" label="Republish" title={`Republish ${listing.name}?`} onConfirm={decide("republish", "Listing republished")} />
          ) : (
            <ReasonButton perm="listings" size="md" label="Unpublish" title={`Unpublish ${listing.name}?`} description="Hidden from customers. The owner keeps access to business mode." presets={["Owner request", "Duplicate"]} onConfirm={decide("unpublish", "Listing unpublished")} />
          )}
          {can("merge") ? (
            <ButtonLink href={`/admin/listings/${listing.id}/merge`} variant="secondary" size="md">
              <GitMerge aria-hidden /> Merge
            </ButtonLink>
          ) : (
            <span className="inline-flex flex-col">
              <button type="button" disabled className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 t-label font-semibold text-navy opacity-50" aria-describedby="merge-denied">
                <GitMerge className="size-[18px]" aria-hidden /> Merge
              </button>
              <span id="merge-denied" className="sr-only">
                {DENIED.merge}
              </span>
            </span>
          )}
        </>
      }
    >
      <div className="mb-4 space-y-3 empty:hidden">
        {listing.suspended && (
          <Banner tone="error" title="Suspended">
            This listing is hidden from search, the app and the web.
          </Banner>
        )}
        {listing.unpublished && <Banner tone="warning" title="Unpublished">Customers can&apos;t see this listing.</Banner>}
        {survivor && (
          <Banner tone="info" title="Merged">
            Merged into <Link href={`/admin/listings/${survivor.id}`} className="font-semibold text-blue hover:underline">{survivor.name}</Link>. Its page redirects there.
          </Banner>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title={<span className="inline-flex items-center gap-2"><Building2 className="size-4 text-blue" aria-hidden />Companies House</span>}>
          {refs("companies_house").length ? (
            refs("companies_house").map((r) => (
              <KeyValues
                key={r.externalId}
                rows={[
                  ["Company number", <span key="n" className="font-mono">{biz?.companyNumber ?? r.externalId}</span>],
                  ["Registered name", `${listing.name.toUpperCase()}${biz?.legalType === "ltd" || /ltd/i.test(listing.name) ? "" : " LTD"}`],
                  ["SIC code", [...new Set(listing.categoryIds.flatMap((c) => cat(c)?.sicCodes ?? []))].join(", ") || "—"],
                  ["Registered office", listing.address],
                  ["Fetched", `${fmtDate(r.fetchedAt)}, ${fmtTime(r.fetchedAt)}`],
                ]}
              />
            ))
          ) : (
            <p className="t-label font-normal text-muted-ink">No Companies House record linked.</p>
          )}
        </Panel>
        <Panel title={<span className="inline-flex items-center gap-2"><MapPin className="size-4 text-blue" aria-hidden />OpenStreetMap</span>}>
          {refs("osm").length ? (
            refs("osm").map((r) => (
              <KeyValues
                key={r.externalId}
                rows={[
                  ["OSM ID", <span key="o" className="font-mono">{r.externalId}</span>],
                  ["Tags", [...new Set(listing.categoryIds.flatMap((c) => cat(c)?.osmTags ?? []))].join(", ") || "—"],
                  ["Location", `${listing.geo.lat.toFixed(4)}, ${listing.geo.lng.toFixed(4)}`],
                  ["Fetched", `${fmtDate(r.fetchedAt)}, ${fmtTime(r.fetchedAt)}`],
                ]}
              />
            ))
          ) : (
            <p className="t-label font-normal text-muted-ink">No OpenStreetMap node linked.</p>
          )}
        </Panel>
        <Panel title={<span className="inline-flex items-center gap-2"><Store className="size-4 text-blue" aria-hidden />Google Places</span>}>
          {refs("places").length || listing.placeId ? (
            <KeyValues
              rows={[
                ["place_id", <span key="p" className="font-mono">{listing.placeId ?? refs("places")[0]?.externalId}</span>],
                ["Stored", "Place ID only"],
              ]}
            />
          ) : (
            <p className="t-label font-normal text-muted-ink">No Places ID stored.</p>
          )}
          <p className="mt-3 t-caption text-muted-ink">Name, rating, hours and photos are details fetched at display time and never stored. lat/lng from Places expires after 30 days.</p>
        </Panel>
        <Panel title={<span className="inline-flex items-center gap-2"><PenLine className="size-4 text-blue" aria-hidden />Owner edits</span>}>
          {biz ? (
            <KeyValues
              rows={[
                ["Business", <Link key="b" href={`/admin/businesses?q=${encodeURIComponent(listing.name)}`} className="text-blue hover:underline">{biz.tradingName}</Link>],
                ["Tenant", <span key="t" className="font-mono">{biz.tenantId}</span>],
                ["Status", biz.status],
                ["Phone", listing.phonePublic],
                ["Website", biz.website || "—"],
                ["Description", listing.description || "—"],
                ["Verified", biz.verifiedAt ? fmtDate(biz.verifiedAt) : "Not yet"],
              ]}
            />
          ) : (
            <p className="t-label font-normal text-muted-ink">Unclaimed. No owner edits.</p>
          )}
        </Panel>
        <Panel title="Enquiries">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ["Calls", byKind("call")],
              ["Messages", byKind("message")],
              ["Bookings", byKind("booking")],
              ["Profile views", byKind("profile_view")],
            ].map(([l, n]) => (
              <div key={String(l)} className="rounded-xl bg-sky p-3">
                <p className="text-[22px] font-bold text-navy tnum">{n}</p>
                <p className="t-caption text-muted-ink">{l}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={`Reviews · ${rating.count ? `${rating.rating.toFixed(1)} from ${rating.count}` : "none"}`} action={<Link href="/admin/reviews" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">Moderate</Link>}>
          {reviews.length ? (
            <ul className="divide-y divide-line">
              {reviews.slice(0, 4).map((r) => (
                <li key={r.id} className="py-2 text-[13.5px]">
                  <div className="flex items-center gap-2">
                    <Stars value={r.stars} size={12} />
                    <span className="font-medium text-navy">{r.authorName}</span>
                    <span className="text-muted-ink">{fmtDate(r.createdAt)}</span>
                    {r.status === "removed" && <Pill tone="bad">Removed</Pill>}
                    {r.flagged && <Pill tone="warn">Flagged</Pill>}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-slate">{r.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-label font-normal text-muted-ink">{listing.layer === "places" ? "Google reviews are shown at display time only." : "No reviews yet."}</p>
          )}
        </Panel>
        <Panel title="Documents">
          {claims.length || creds.length ? (
            <ul className="divide-y divide-line text-[13.5px]">
              {claims.filter((c) => c.evidenceUrl).map((c) => (
                <li key={c.id} className="flex min-h-11 items-center gap-2 py-1.5">
                  <FileText className="size-4 text-blue" aria-hidden />
                  <span className="flex-1">{c.evidenceKind ?? "Document"} · {c.evidenceUrl}</span>
                  <Pill tone={c.status === "approved" ? "good" : c.status === "rejected" ? "bad" : "warn"}>Claim {c.status}</Pill>
                </li>
              ))}
              {creds.map((c) => (
                <li key={c.id} className="flex min-h-11 items-center gap-2 py-1.5">
                  <FileText className="size-4 text-blue" aria-hidden />
                  <span className="flex-1">{c.label}{c.expiresAt ? ` · expires ${fmtDateYear(c.expiresAt)}` : ""}</span>
                  <Pill tone={c.status === "verified" ? "good" : c.status === "pending" ? "warn" : "bad"}>{c.status}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-label font-normal text-muted-ink">No documents.</p>
          )}
        </Panel>
        <Panel title="History">
          <ol className="space-y-2 text-[13.5px]">
            {history.slice(0, 8).map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-28 shrink-0 text-muted-ink tnum">{fmtDate(h.at)}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-navy">{h.who}</span> <span className="text-slate">{h.what}</span>
                  {h.reason && <span className="block truncate text-muted-ink">“{h.reason}”</span>}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </AdminPage>
  )
}
