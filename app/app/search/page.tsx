"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowUpLeft, Clock, MapPin, Search, Sparkles, Store, TrendingUp } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { Icon } from "@/components/answerd/Icon"
import { useStore } from "@/lib/store"
import { queryCategories } from "@/lib/search"

const POPULAR = ["Boiler service", "End of tenancy clean", "Skin fade", "MOT", "Locksmith", "Man and van"]

/** C-11: suggestions as you type, recent searches, popular near you. */
export default function SearchPage() {
  const router = useRouter()
  const s = useStore()
  const [q, setQ] = React.useState("")
  const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)
  const recent = profile ? profile.recentSearches : s.session.guestRecentSearches
  const district = s.session.location?.postcode.split(" ")[0]
  const term = q.trim().toLowerCase()

  const catSugg = term ? queryCategories(s, term).map((id) => s.categories.find((c) => c.id === id)!).filter(Boolean).slice(0, 4) : []
  const bizSugg = term.length > 1 ? s.listings.filter((l) => !l.suspended && !l.mergedInto && l.name.toLowerCase().includes(term)).slice(0, 4) : []
  const phrase = catSugg[0] && district ? `${catSugg[0].name.toLowerCase()} near ${district}` : null
  const noMatch = term.length > 1 && !catSugg.length && !bizSugg.length

  const go = (query: string, category?: string) => {
    s.recordSearch(query)
    router.push(category ? `/app/results?category=${category}` : `/app/results?q=${encodeURIComponent(query)}`)
  }

  return (
    <AppScreen
      id="C-11"
      tabs="customer"
      bg="white"
      header={
        <form
          role="search"
          className="flex items-center gap-1 border-b border-line px-2 py-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (q.trim()) go(q.trim())
          }}
        >
          <button type="button" onClick={() => router.back()} className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky" aria-label="Back">
            <ArrowLeft className="size-5" />
          </button>
          <label className="flex h-11 flex-1 items-center gap-2 rounded-full border border-blue bg-white px-4 ring-3 ring-blue/15">
            <Search className="size-4 text-navy" aria-hidden />
            <span className="sr-only">What service do you need?</span>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="What service do you need?" enterKeyHint="search" className="h-full min-w-0 flex-1 bg-transparent t-body text-navy outline-none placeholder:text-muted-ink" />
          </label>
        </form>
      }
    >
      <div className="px-4 py-3">
        {term ? (
          <ul aria-label="Suggestions" className="divide-y divide-line">
            {catSugg.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => go(c.plural, c.id)} className="flex min-h-13 w-full items-center gap-3 py-2.5 text-left">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-blue-tint text-blue">
                    <Icon name={c.icon} size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block t-label text-navy">{c.plural}</span>
                    <span className="block t-caption text-muted-ink">Service</span>
                  </span>
                  <ArrowUpLeft className="size-4 text-muted-ink" aria-hidden />
                </button>
              </li>
            ))}
            {phrase && (
              <li>
                <button type="button" onClick={() => go(phrase)} className="flex min-h-13 w-full items-center gap-3 py-2.5 text-left">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-sky text-navy">
                    <MapPin className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1 t-label text-navy">{phrase}</span>
                </button>
              </li>
            )}
            {bizSugg.map((l) => (
              <li key={l.id}>
                <Link href={`/app/b/${l.slug}`} onClick={() => s.recordSearch(l.name)} className="flex min-h-13 items-center gap-3 py-2.5">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-sky text-navy">
                    <Store className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="block t-label text-navy">{l.name}</span>
                    <span className="block t-caption text-muted-ink">
                      Business · {l.address.split(", ").at(-1)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {noMatch && (
              <li>
                <Link href={`/app/ask?q=${encodeURIComponent(q.trim())}`} className="flex min-h-13 items-center gap-3 py-2.5">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-teal-tint text-teal-ink">
                    <Sparkles className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="block t-label text-navy">Ask Answerd instead</span>
                    <span className="block t-caption text-muted-ink">We couldn&apos;t match “{q.trim()}”. Describe the job and we&apos;ll find someone.</span>
                  </span>
                </Link>
              </li>
            )}
            {!noMatch && (
              <li>
                <button type="button" onClick={() => go(q.trim())} className="flex min-h-13 w-full items-center gap-3 py-2.5 text-left">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-sky text-navy">
                    <Search className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1 t-label text-navy">Search for “{q.trim()}”</span>
                </button>
              </li>
            )}
          </ul>
        ) : (
          <div className="space-y-6">
            {recent.length > 0 && (
              <section aria-labelledby="recent">
                <div className="flex items-center justify-between">
                  <h2 id="recent" className="t-subhead">
                    Recent searches
                  </h2>
                  <button type="button" onClick={s.clearRecentSearches} className="inline-flex min-h-11 items-center t-label text-blue">
                    Clear
                  </button>
                </div>
                <ul className="divide-y divide-line">
                  {recent.map((r) => (
                    <li key={r}>
                      <button type="button" onClick={() => go(r)} className="flex min-h-12 w-full items-center gap-3 text-left t-label font-normal text-navy">
                        <Clock className="size-4 text-muted-ink" aria-hidden /> {r}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section aria-labelledby="popular">
              <h2 id="popular" className="mb-3 flex items-center gap-2 t-subhead">
                <TrendingUp className="size-4 text-blue" aria-hidden /> Popular near {district ?? "you"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button key={p} type="button" onClick={() => go(p)} className="inline-flex h-9 items-center rounded-full border border-line bg-white px-3.5 t-label text-navy hover:border-blue">
                    {p}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppScreen>
  )
}
