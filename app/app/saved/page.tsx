"use client"
import * as React from "react"
import Link from "next/link"
import { Heart, MessageCircle, Phone } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { ListingAvatar } from "@/components/answerd/Media"
import { Rating } from "@/components/answerd/Rating"
import { Badge } from "@/components/answerd/Badges"
import { DataGate, signInHref } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { isDeskLive, listingRating } from "@/lib/selectors"
import { toast } from "@/lib/toast"

/** C-37: saved businesses with quick Call and Message. */
export default function SavedPage() {
  const s = useStore()
  const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)
  const saved = (profile?.savedListingIds ?? []).map((id) => s.listings.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => !!l)
  return (
    <AppScreen id="C-37" header={<TopBar title="Saved" back="/app/account" />}>
      <div className="p-4">
        {!profile ? (
          <EmptyState title="Sign in to save businesses" body="Tap the heart on any business to keep it here." action={<ButtonLink href={signInHref("/app/saved")} size="md">Sign in</ButtonLink>} />
        ) : (
          <DataGate isEmpty={!saved.length} empty={<EmptyState title="Nothing saved yet" body="Tap the heart on any business to keep it here." action={<ButtonLink href="/app/search" size="md">Find a business</ButtonLink>} />}>
            <ul className="grid grid-cols-2 gap-3">
              {saved.map((l) => {
                const r = listingRating(s, l)
                return (
                  <li key={l.id} className="card flex flex-col p-3">
                    <div className="flex items-start justify-between">
                      <ListingAvatar initials={l.initials} hue={l.hue} size={44} />
                      <button type="button" aria-label={`Remove ${l.name} from saved`} onClick={() => (s.toggleSave(l.id), toast("Removed from saved", () => s.toggleSave(l.id)))} className="-m-1 inline-flex size-11 items-center justify-center rounded-full hover:bg-sky">
                        <Heart className="size-5 fill-red text-red" />
                      </button>
                    </div>
                    <Link href={`/app/b/${l.slug}`} className="mt-2 line-clamp-2 t-label font-semibold text-navy hover:text-blue">
                      {l.name}
                    </Link>
                    <Rating value={r.rating} count={r.count} compact className="mt-1" />
                    {isDeskLive(s, l) && <Badge kind="responds_instantly" className="mt-2 self-start" />}
                    <div className="mt-auto flex gap-1 pt-3">
                      <Link href={`/app/b/${l.slug}/call`} aria-label={`Call ${l.name}`} className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-line text-navy hover:bg-sky">
                        <Phone className="size-4" />
                      </Link>
                      {l.layer === "claimed" && (
                        <Link href={`/app/b/${l.slug}/enquiry`} aria-label={`Message ${l.name}`} className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-line text-navy hover:bg-sky">
                          <MessageCircle className="size-4" />
                        </Link>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </DataGate>
        )}
      </div>
    </AppScreen>
  )
}
