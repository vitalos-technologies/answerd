"use client"
import * as React from "react"
import Link from "next/link"
import { ChevronRight, Search } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Icon } from "@/components/answerd/Icon"
import { EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import { CATEGORY_GROUPS } from "@/lib/categories"
import { DataGate } from "@/components/app/helpers"

/** C-10: grouped list with search within. */
export default function CategoriesPage() {
  const cats = useStore((s) => s.categories)
  const [q, setQ] = React.useState("")
  const match = (name: string) => name.toLowerCase().includes(q.trim().toLowerCase())
  const groups = CATEGORY_GROUPS.map((g) => ({ ...g, items: cats.filter((c) => c.parentId === g.id && (match(c.name) || match(c.plural))) })).filter((g) => g.items.length)

  return (
    <AppScreen
      id="C-10"
      tabs="customer"
      header={
        <div className="border-b border-line bg-white">
          <TopBar title="All categories" back="/app" tone="clear" />
          <div className="px-4 pb-3">
            <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-sky px-4">
              <Search className="size-4 text-muted-ink" aria-hidden />
              <span className="sr-only">Search categories</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories" className="h-full flex-1 bg-transparent t-body text-navy outline-none placeholder:text-muted-ink" />
            </label>
          </div>
        </div>
      }
    >
      <div className="px-4 py-4">
        <DataGate isEmpty={!groups.length} empty={<EmptyState title="No categories match" body="Try another word, or ask Answerd to find the right business." action={<ButtonLink href="/app/ask" size="md">Ask Answerd instead</ButtonLink>} />}>
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.id} aria-labelledby={`g-${g.id}`}>
                <h2 id={`g-${g.id}`} className="mb-2 flex items-center gap-2 t-heading">
                  <Icon name={g.icon} className="text-blue" /> {g.name}
                </h2>
                <ul className="card divide-y divide-line overflow-hidden">
                  {g.items.map((c) => (
                    <li key={c.id}>
                      <Link href={`/app/results?category=${c.id}`} className="flex min-h-13 items-center gap-3 px-4 py-3 hover:bg-sky">
                        <span className="inline-flex size-9 items-center justify-center rounded-full bg-blue-tint text-blue">
                          <Icon name={c.icon} size={18} />
                        </span>
                        <span className="flex-1 t-label text-navy">{c.plural}</span>
                        <ChevronRight className="size-5 text-muted-ink" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DataGate>
      </div>
    </AppScreen>
  )
}
