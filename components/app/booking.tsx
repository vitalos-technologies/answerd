"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { listingBySlug } from "@/lib/selectors"
import { signInHref } from "./helpers"
import type { Listing } from "@/lib/types"

/** Shared guard for C-24 to C-27: signed in, listing exists, draft belongs to this listing. */
export function useBookingDraft(slug: string, step: "service" | "time" | "details" | "confirm") {
  const router = useRouter()
  const s = useStore()
  const listing = listingBySlug(s, slug) as Listing | undefined
  const draft = s.draft && listing && s.draft.listingId === listing.id ? s.draft : null
  const needs = step === "service" ? false : step === "time" ? !draft?.serviceId : step === "details" ? !draft?.startAt : !draft?.startAt

  React.useEffect(() => {
    if (!s.session.userId) {
      router.replace(signInHref(`/app/b/${slug}/book`))
      return
    }
    if (listing && listing.layer !== "claimed") {
      router.replace(`/app/b/${slug}`)
      return
    }
    if (listing && step === "service" && !draft) s.setDraft({ listingId: listing.id, contactPhone: s.users.find((u) => u.id === s.session.userId)?.phone })
    if (listing && needs) router.replace(`/app/b/${slug}/book`)
  }, [s, listing, draft, needs, router, slug, step])

  return { listing, draft, s }
}

export const BOOK_STEPS = ["Service", "Time", "Details", "Confirm"]
