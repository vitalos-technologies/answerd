"use client"
import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { AdminPage, Panel, ReasonButton, adminInput } from "@/components/admin/kit"
import { Icon } from "@/components/answerd/Icon"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import type { Category } from "@/lib/types"

const split = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean)

function Rename({ c }: { c: Category }) {
  const [name, setName] = React.useState(c.name)
  return (
    <ReasonButton perm="taxonomy" label="Rename" title={`Rename ${c.name}`} validate={() => (name.trim().length < 2 ? "Enter a name." : null)} onConfirm={(r) => { useStore.getState().adminTaxonomy("rename", { id: c.id, name: name.trim() }, r); toast("Category renamed") }}>
      <label className="flex flex-col gap-1.5">
        <span className="t-label text-navy">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={adminInput} />
      </label>
    </ReasonButton>
  )
}

function Mappings({ c }: { c: Category }) {
  const [sic, setSic] = React.useState(c.sicCodes.join(", "))
  const [osm, setOsm] = React.useState(c.osmTags.join(", "))
  const [places, setPlaces] = React.useState(c.placesTypes.join(", "))
  return (
    <ReasonButton perm="taxonomy" label="Mappings" title={`Mappings for ${c.name}`} description="Imports use SIC codes and OSM tags; gap-fill uses Places types. Separate values with commas." confirmLabel="Save mappings" onConfirm={(r) => { useStore.getState().adminTaxonomy("map", { id: c.id, sicCodes: split(sic), osmTags: split(osm), placesTypes: split(places) }, r); toast("Mappings saved") }}>
      <div className="grid gap-3">
        {[
          ["SIC codes", sic, setSic],
          ["OSM tags", osm, setOsm],
          ["Google Places types", places, setPlaces],
        ].map(([label, v, set]) => (
          <label key={label as string} className="flex flex-col gap-1.5">
            <span className="t-label text-navy">{label as string}</span>
            <input value={v as string} onChange={(e) => (set as (x: string) => void)(e.target.value)} className={adminInput} />
          </label>
        ))}
      </div>
    </ReasonButton>
  )
}

function Merge({ c, leaves }: { c: Category; leaves: Category[] }) {
  const options = leaves.filter((x) => x.id !== c.id)
  const [into, setInto] = React.useState(options[0]?.id ?? "")
  return (
    <ReasonButton perm="taxonomy" label="Merge" variant="destructive" title={`Merge ${c.name} into another category`} description="Listings, Featured slots and home tiles move to the category you choose. This one is removed." confirmLabel="Merge" onConfirm={(r) => { useStore.getState().adminTaxonomy("merge", { id: c.id, intoId: into }, r); toast(`${c.name} merged`) }}>
      <label className="flex flex-col gap-1.5">
        <span className="t-label text-navy">Merge into</span>
        <select value={into} onChange={(e) => setInto(e.target.value)} className={adminInput}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
    </ReasonButton>
  )
}

function AddCategory({ groups }: { groups: Category[] }) {
  const [name, setName] = React.useState("")
  const [parent, setParent] = React.useState(groups[0]?.id ?? "")
  const [sic, setSic] = React.useState("")
  const [osm, setOsm] = React.useState("")
  const [places, setPlaces] = React.useState("")
  return (
    <ReasonButton perm="taxonomy" size="md" variant="primary" label="Add category" icon={<Plus aria-hidden />} title="Add a category" confirmLabel="Add" validate={() => (name.trim().length < 2 ? "Enter a name." : null)} onConfirm={(r) => { useStore.getState().adminTaxonomy("add", { name: name.trim(), parentId: parent, sicCodes: split(sic), osmTags: split(osm), placesTypes: split(places) }, r); setName(""); toast("Category added") }}>
      <div className="grid gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="t-label text-navy">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tree surgeons" className={adminInput} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="t-label text-navy">Group</span>
          <select value={parent} onChange={(e) => setParent(e.target.value)} className={adminInput}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1.5"><span className="t-label text-navy">SIC</span><input value={sic} onChange={(e) => setSic(e.target.value)} placeholder="81300" className={adminInput} /></label>
          <label className="flex flex-col gap-1.5"><span className="t-label text-navy">OSM tag</span><input value={osm} onChange={(e) => setOsm(e.target.value)} placeholder="craft=gardener" className={adminInput} /></label>
          <label className="flex flex-col gap-1.5"><span className="t-label text-navy">Places type</span><input value={places} onChange={(e) => setPlaces(e.target.value)} placeholder="landscaper" className={adminInput} /></label>
        </div>
      </div>
    </ReasonButton>
  )
}

/** A-15: category tree with SIC, OSM and Places mappings; add, rename, merge. */
export default function AdminTaxonomy() {
  const s = useStore()
  const groups = s.categories.filter((c) => !c.parentId)
  const leaves = s.categories.filter((c) => c.parentId)
  const count = (id: string) => s.listings.filter((l) => !l.mergedInto && l.categoryIds.includes(id)).length
  return (
    <AdminPage id="A-15" title="Taxonomy" perm="taxonomy" description={`${groups.length} groups and ${leaves.length} categories. One tree, used by search, imports and gap-fill.`} actions={<AddCategory groups={groups} />}>
      <div className="space-y-4">
        {groups.map((g) => (
          <Panel key={g.id} title={<span className="inline-flex items-center gap-2"><Icon name={g.icon} className="size-4 text-blue" aria-hidden />{g.name}</span>}>
            <table className="w-full text-[13.5px]" aria-label={g.name}>
              <thead>
                <tr className="border-b border-line text-left text-[12.5px] text-navy">
                  <th className="py-2 font-semibold">Category</th>
                  <th className="py-2 font-semibold">SIC codes</th>
                  <th className="py-2 font-semibold">OSM tags</th>
                  <th className="py-2 font-semibold">Places types</th>
                  <th className="py-2 text-right font-semibold">Listings</th>
                  <th className="py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {leaves.filter((c) => c.parentId === g.id).map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0">
                    <td className="py-1.5 font-medium text-navy">{c.name}</td>
                    <td className="py-1.5 font-mono text-[12.5px] text-slate">{c.sicCodes.join(", ") || "—"}</td>
                    <td className="py-1.5 font-mono text-[12.5px] text-slate">{c.osmTags.join(", ") || "—"}</td>
                    <td className="py-1.5 font-mono text-[12.5px] text-slate">{c.placesTypes.join(", ") || "—"}</td>
                    <td className="py-1.5 text-right tnum">
                      <Link href={`/admin/listings?category=${c.id}`} className="inline-flex min-h-10 items-center justify-end text-blue hover:underline">{count(c.id)}</Link>
                    </td>
                    <td className="py-1.5">
                      <div className="flex justify-end gap-1.5">
                        <Rename key={`${c.id}-${c.name}`} c={c} />
                        <Mappings key={`${c.id}-m-${c.sicCodes.join()}${c.osmTags.join()}${c.placesTypes.join()}`} c={c} />
                        <Merge c={c} leaves={leaves} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ))}
      </div>
    </AdminPage>
  )
}
