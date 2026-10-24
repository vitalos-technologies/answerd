"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Heart, Share2 } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { ShareSheet } from "./listing"
import { useStore } from "@/lib/store"
import type { Listing } from "@/lib/types"

/** C-35: thanks, then offer to recommend the business. */
export function ReviewDone({ listing, doneHref }: { listing?: Listing; doneHref: string }) {
  const router = useRouter()
  const s = useStore()
  const [share, setShare] = React.useState(false)
  return (
    <AppScreen id="C-35" bg="white">
      <div className="flex min-h-full flex-col px-6 pb-6 pt-14">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex size-24 items-center justify-center rounded-full bg-blue-tint text-blue animate-tick">
            <Heart className="size-11 fill-blue" aria-hidden />
          </span>
          <h1 className="t-display mt-6">Thanks for your review</h1>
          <p className="mt-2 t-body text-slate">It&apos;s live now and helps your neighbours choose.</p>
        </div>
        {listing && (
          <div className="card mt-8 p-4 text-center">
            <p className="t-subhead">Recommend {listing.name} to a friend?</p>
            <p className="mt-1 t-label font-normal text-slate">Share their profile in a message.</p>
          </div>
        )}
        <div className="mt-auto space-y-2 pt-8">
          {listing && (
            <Button block onClick={() => setShare(true)}>
              <Share2 /> Share
            </Button>
          )}
          <Button block variant="secondary" onClick={() => router.replace(doneHref)}>
            Done
          </Button>
        </div>
      </div>
      {listing && <ShareSheet open={share} onClose={() => setShare(false)} listing={listing} title={`Recommend ${listing.name}`} onShared={() => s.recommend(listing.id)} />}
    </AppScreen>
  )
}
