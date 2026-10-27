import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { PageHeader } from "@/components/web/ui"
import { ResultCard } from "@/components/web/result-card"
import { GoogleResults } from "@/components/web/google-results"
import { btnPrimary, inputCls } from "@/components/web/form"
import { apiMode, getSearch } from "@/lib/data/source"
import { cardData, categoryListings, rank } from "@/lib/data/queries"
import { LEAF_CATEGORIES } from "@/lib/data/categories"
import { fill } from "@/lib/fill"
import { cn } from "@/lib/utils"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.search.metaTitle, path: "/search", noindex: true })

/** Static data: the first category whose name matches, in the typed district (no API to ask). */
function seedSearch(q: string, postcode: string) {
  const term = q.toLowerCase()
  const cat = LEAF_CATEGORIES.find((c) => [c.name, c.plural].some((n) => n.toLowerCase().includes(term) || term.includes(n.toLowerCase())))
  if (!cat) return []
  const district = postcode.toUpperCase().replace(/\s.*/, "")
  return rank(categoryListings(cat.id).filter((l) => !district || l.postcodeDistrict === district)).map(cardData)
}

/** W-02: search results. Query-driven, so rendered per request and never cached. */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 100)
  const postcode = (typeof sp.postcode === "string" ? sp.postcode : "").trim().toUpperCase().slice(0, 10)
  const c = pages.search
  const asked = q !== "" && postcode !== ""
  const { cards, error } = !asked ? { cards: [] } : apiMode ? await getSearch(q, postcode) : { cards: seedSearch(q, postcode) }

  return (
    <WebPage>
      <PageHeader title={asked ? fill(c.headingFor, { q, postcode }) : c.heading}>
        <form action="/search" className="mt-6 grid max-w-[46rem] gap-3 sm:grid-cols-[1fr_160px_auto]" role="search">
          <label className="sr-only" htmlFor="s-q">
            {c.what}
          </label>
          <input id="s-q" name="q" defaultValue={q} placeholder={c.whatPlaceholder} className={inputCls} />
          <label className="sr-only" htmlFor="s-pc">
            {c.where}
          </label>
          <input id="s-pc" name="postcode" defaultValue={postcode} placeholder={c.wherePlaceholder} autoComplete="postal-code" className={cn(inputCls, "uppercase")} />
          <button type="submit" className={btnPrimary}>
            {c.submit}
          </button>
        </form>
      </PageHeader>
      <div className="container-site py-10 md:py-14">
        {!asked ? (
          <p className="text-slate">{c.needBoth}</p>
        ) : error ? (
          <p className="text-slate" role="status">
            {error}
          </p>
        ) : (
          <>
            <p className="tnum font-semibold text-navy" role="status">
              {fill(c.count, { count: cards.length })}
            </p>
            {cards.length ? (
              <ul className="mt-4 grid gap-4">
                {cards.map((card) => (
                  <li key={card.slug} className="min-w-0">
                    <ResultCard c={card} headingLevel="h2" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate">{c.none}</p>
            )}
            {apiMode && <GoogleResults query={{ q, postcode }} heading={fill(c.google, { postcode })} />}
          </>
        )}
      </div>
    </WebPage>
  )
}
