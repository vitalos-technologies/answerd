"use client"
import * as React from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { AdminPage, Panel, ReasonButton, adminInput, useCan } from "@/components/admin/kit"
import { IconButton } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { uid } from "@/lib/prng"
import { DEFAULT_FAQS } from "@/components/admin/data"

/** A-20: home category order, banners, SEO intro templates and FAQs. */
export default function AdminContent() {
  const s = useStore()
  const can = useCan()
  const editable = can("content")
  const [order, setOrder] = React.useState(s.settings.homeCategoryOrder)
  const [banner, setBanner] = React.useState(s.settings.homeBanner)
  const [seo, setSeo] = React.useState(s.settings.seoIntroTemplate)
  const [faqs, setFaqs] = React.useState(s.settings.faqs ?? DEFAULT_FAQS)
  const leaves = s.categories.filter((c) => c.parentId)
  const [addCat, setAddCat] = React.useState("")
  const move = (i: number, d: -1 | 1) => setOrder((o) => {
    const n = [...o]
    const j = i + d
    if (j < 0 || j >= n.length) return o
    ;[n[i], n[j]] = [n[j]!, n[i]!]
    return n
  })
  const save = (patch: Parameters<ReturnType<typeof useStore.getState>["updateSettings"]>[0], msg: string) => (reason: string) => {
    useStore.getState().updateSettings(patch, reason)
    toast(msg)
  }
  const sample = seo.replace("{category}", "plumbers").replace("{area}", "South Norwood")
  return (
    <AdminPage id="A-20" title="Content" perm="content" description="What customers see on Home (C-09, W-01), on SEO pages (W-03, W-04) and in Help (W-20).">
      <div className="grid grid-cols-2 gap-4">
        <Panel title="Home categories order" action={<ReasonButton perm="content" label="Save order" variant="primary" title="Save the Home category order?" onConfirm={save({ homeCategoryOrder: order }, "Home order saved")} />}>
          <ol className="space-y-1">
            {order.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-lg border border-line px-3">
                <span className="w-5 text-muted-ink tnum">{i + 1}</span>
                <span className="flex-1 t-label text-navy">{s.categories.find((c) => c.id === id)?.plural ?? id}</span>
                <IconButton label={`Move ${id} up`} disabled={!editable || i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp />
                </IconButton>
                <IconButton label={`Move ${id} down`} disabled={!editable || i === order.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown />
                </IconButton>
                <IconButton label={`Remove ${id}`} disabled={!editable || order.length <= 4} onClick={() => setOrder((o) => o.filter((x) => x !== id))}>
                  <Trash2 />
                </IconButton>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex gap-2">
            <label className="flex-1">
              <span className="sr-only">Category to add</span>
              <select value={addCat} onChange={(e) => setAddCat(e.target.value)} className={adminInput} disabled={!editable}>
                <option value="">Add a category…</option>
                {leaves.filter((c) => !order.includes(c.id)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.plural}
                  </option>
                ))}
              </select>
            </label>
            <IconButton label="Add category to Home" tone="tint" disabled={!editable || !addCat} onClick={() => { setOrder((o) => [...o, addCat]); setAddCat("") }}>
              <Plus />
            </IconButton>
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Home banner" action={<ReasonButton perm="content" label={banner || !s.settings.homeBanner ? "Publish banner" : "Clear banner"} disabled={!banner && !s.settings.homeBanner} variant="primary" title={banner ? "Publish this banner on Home?" : "Remove the Home banner?"} onConfirm={save({ homeBanner: banner.trim() }, banner ? "Banner published" : "Banner removed")} />}>
            <label className="flex flex-col gap-1.5">
              <span className="t-label text-navy">Text (leave empty for no banner)</span>
              <input value={banner} onChange={(e) => setBanner(e.target.value)} maxLength={90} placeholder="e.g. Boiler season: book a service before winter" className={adminInput} disabled={!editable} />
            </label>
            <p className="mt-1 t-caption text-muted-ink">{banner.length}/90</p>
          </Panel>
          <Panel title="SEO page intro template" action={<ReasonButton perm="content" label="Save template" variant="primary" title="Save the SEO intro template?" validate={() => (!seo.includes("{category}") ? "Keep {category} in the template." : null)} onConfirm={save({ seoIntroTemplate: seo.trim() }, "Template saved")} />}>
            <label className="flex flex-col gap-1.5">
              <span className="t-label text-navy">Template. Use {"{category}"} and {"{area}"}</span>
              <textarea value={seo} onChange={(e) => setSeo(e.target.value)} rows={3} className={`${adminInput} h-auto py-2`} disabled={!editable} />
            </label>
            <p className="mt-2 rounded-lg bg-sky p-3 t-label font-normal text-slate">Preview: {sample}</p>
          </Panel>
        </div>
      </div>
      <Panel className="mt-4" title="FAQs" action={<ReasonButton perm="content" label="Save FAQs" variant="primary" title="Save the FAQs?" validate={() => (faqs.some((f) => !f.q.trim() || !f.a.trim()) ? "Every FAQ needs a question and an answer." : null)} onConfirm={save({ faqs }, "FAQs saved")} />}>
        <ul className="space-y-3">
          {faqs.map((f, i) => (
            <li key={f.id} className="grid grid-cols-[1fr_1.6fr_auto] items-start gap-2">
              <label>
                <span className="sr-only">Question {i + 1}</span>
                <input value={f.q} onChange={(e) => setFaqs((x) => x.map((y) => (y.id === f.id ? { ...y, q: e.target.value } : y)))} className={adminInput} disabled={!editable} />
              </label>
              <label>
                <span className="sr-only">Answer {i + 1}</span>
                <textarea value={f.a} onChange={(e) => setFaqs((x) => x.map((y) => (y.id === f.id ? { ...y, a: e.target.value } : y)))} rows={2} className={`${adminInput} h-auto py-2`} disabled={!editable} />
              </label>
              <IconButton label={`Delete question ${i + 1}`} disabled={!editable} onClick={() => setFaqs((x) => x.filter((y) => y.id !== f.id))}>
                <Trash2 />
              </IconButton>
            </li>
          ))}
        </ul>
        <button type="button" disabled={!editable} onClick={() => setFaqs((x) => [...x, { id: uid("faq"), q: "", a: "" }])} className="mt-3 inline-flex min-h-11 items-center gap-1.5 t-label text-blue hover:underline disabled:opacity-50">
          <Plus className="size-4" aria-hidden /> Add a question
        </button>
      </Panel>
    </AdminPage>
  )
}
