"use client"
import * as React from "react"
import { use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { PhotoTile } from "@/components/answerd/Media"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { businessById, listingBySlug } from "@/lib/selectors"
import { withSuspense } from "@/components/app/helpers"

/** C-18: full-screen swipe, counter, caption. */
function Gallery({ slug }: { slug: string }) {
  const router = useRouter()
  const start = Number(useSearchParams().get("i") ?? 0)
  const s = useStore()
  const listing = listingBySlug(s, slug)
  const photos = businessById(s, listing?.businessId)?.photos ?? []
  const [i, setI] = React.useState(start)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (el) el.scrollLeft = start * el.clientWidth
  }, [start])
  const go = (n: number) => {
    const el = ref.current
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" })
  }
  const close = () => (window.history.length > 1 ? router.back() : router.push(`/app/b/${slug}`))

  return (
    <div className="t-app absolute inset-0 flex flex-col bg-black text-white">
      <ScreenMeta id="C-18" />
      <div className="flex items-center justify-between px-2 py-1">
        <button type="button" onClick={close} aria-label="Close gallery" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10">
          <X className="size-6" />
        </button>
        <span className="t-label tnum" aria-live="polite">
          {photos.length ? `${i + 1} / ${photos.length}` : ""}
        </span>
        <span className="size-11" />
      </div>
      {photos.length ? (
        <>
          <div ref={ref} onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto" aria-roledescription="carousel" aria-label={`${listing?.name} photos`} tabIndex={0}>
            {photos.map((p, k) => (
              <figure key={p.id} className="flex w-full shrink-0 snap-center flex-col items-center justify-center px-3" aria-roledescription="slide" aria-label={`${k + 1} of ${photos.length}`}>
                <PhotoTile hue={p.hue} icon={p.icon} className="aspect-[4/3] w-full" label={p.caption} rounded="rounded-2xl" />
                <figcaption className="mt-4 t-body text-white/90">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 pb-8 pt-4">
            <button type="button" disabled={i === 0} onClick={() => go(i - 1)} aria-label="Previous photo" className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 disabled:opacity-30">
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" disabled={i >= photos.length - 1} onClick={() => go(i + 1)} aria-label="Next photo" className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 disabled:opacity-30">
              <ChevronRight className="size-6" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-sky text-navy">
          <EmptyState title="No photos yet" body="This business hasn't added photos." />
        </div>
      )}
    </div>
  )
}

const G = withSuspense(Gallery)
export default function PhotosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <G slug={slug} />
}
