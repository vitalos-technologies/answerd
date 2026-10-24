"use client"
// shadcn data table pattern on @tanstack/react-table: sorting, search, facet filters, column visibility, pagination, row selection.
import * as React from "react"
import { useRouter } from "next/navigation"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3, Search, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/answerd/Button"
import { EmptyState, ErrorState, Skeleton } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export type { ColumnDef }

export interface Facet {
  /** Column id to filter on (exact match on the column's value). */
  column: string
  label: string
  options: { value: string; label: string }[]
}

/** Sortable header button for column defs. */
export function SortHeader({ label, column }: { label: string; column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void } }) {
  const s = column.getIsSorted()
  const I = s === "asc" ? ArrowUp : s === "desc" ? ArrowDown : ArrowUpDown
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(s === "asc")}
      className="-ml-2 inline-flex min-h-9 items-center gap-1 rounded-md px-2 font-semibold text-navy hover:bg-sky"
      aria-label={`Sort by ${label}${s ? (s === "asc" ? ", ascending" : ", descending") : ""}`}
    >
      {label}
      <I className={cn("size-3.5", s ? "text-blue" : "text-muted-ink")} aria-hidden />
    </button>
  )
}

/** Checkbox column for row selection. */
export function selectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all rows on this page"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" onClick={(e) => e.stopPropagation()} />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 36,
  }
}

const exactFilter = (row: Row<unknown>, id: string, value: string) => {
  if (!value) return true
  const v = row.getValue(id)
  return Array.isArray(v) ? v.map(String).includes(value) : String(v) === value
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search",
  facets = [],
  initialFilters,
  initialSort,
  initialHidden,
  pageSize = 12,
  rowHref,
  getRowId,
  bulk,
  emptyTitle = "Nothing here",
  emptyBody = "Nothing matches these filters.",
  emptyAction,
  toolbarExtra,
  label,
  searchKey,
  initialSearch,
}: {
  data: T[]
  columns: ColumnDef<T>[]
  searchPlaceholder?: string
  facets?: Facet[]
  initialFilters?: Record<string, string>
  initialSort?: SortingState
  initialHidden?: VisibilityState
  pageSize?: number
  rowHref?: (row: T) => string
  getRowId?: (row: T) => string
  /** Renders bulk actions for the selected rows; enables the selection column when set. */
  bulk?: (rows: T[], clear: () => void) => React.ReactNode
  emptyTitle?: string
  emptyBody?: string
  emptyAction?: React.ReactNode
  toolbarExtra?: React.ReactNode
  label: string
  /** Optional: a function returning the searchable text for a row. */
  searchKey?: (row: T) => string
  initialSearch?: string
}) {
  const router = useRouter()
  const override = useStore((s) => s.stateOverride)
  const [sorting, setSorting] = React.useState<SortingState>(initialSort ?? [])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(() => Object.entries(initialFilters ?? {}).filter(([, v]) => v).map(([id, value]) => ({ id, value })))
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialHidden ?? {})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = React.useState(initialSearch ?? "")

  const cols = React.useMemo(() => {
    const withFilters = columns.map((c) => (c.filterFn ? c : { ...c, filterFn: exactFilter as never }))
    return bulk ? [selectColumn<T>(), ...withFilters] : withFilters
  }, [columns, bulk])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: cols,
    getRowId: getRowId ? (r) => getRowId(r) : undefined,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _id, value: string) => {
      const q = String(value ?? "").trim().toLowerCase()
      if (!q) return true
      const text = searchKey ? searchKey(row.original) : row.getAllCells().map((c) => String(c.getValue() ?? "")).join(" ")
      return text.toLowerCase().includes(q)
    },
    enableRowSelection: !!bulk,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const selected = table.getFilteredSelectedRowModel().rows.map((r) => r.original)
  const filtered = table.getFilteredRowModel().rows.length
  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()
  const anyFilter = globalFilter || columnFilters.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-[12px] border border-line bg-white pl-9 pr-3 text-[14px] text-navy outline-none placeholder:text-muted-ink focus:border-blue focus:ring-3 focus:ring-blue/20"
          />
        </label>
        {facets.map((f) => {
          const col = table.getColumn(f.column)
          const value = (col?.getFilterValue() as string) ?? ""
          return (
            <label key={f.column} className="relative">
              <span className="sr-only">{f.label}</span>
              <select
                value={value}
                onChange={(e) => col?.setFilterValue(e.target.value || undefined)}
                className={cn(
                  "h-11 appearance-none rounded-[12px] border bg-white pl-3 pr-8 text-[14px] outline-none focus:border-blue focus:ring-3 focus:ring-blue/20",
                  value ? "border-blue text-blue" : "border-line text-navy",
                )}
              >
                <option value="">{f.label}: all</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {f.label}: {o.label}
                  </option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted-ink" aria-hidden />
            </label>
          )
        })}
        {anyFilter && (
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setGlobalFilter("")
              setColumnFilters([])
            }}
          >
            <X aria-hidden /> Clear
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {toolbarExtra}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="md">
                <Columns3 aria-hidden /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Show columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((c) => c.getCanHide())
                .map((c) => (
                  <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)} onSelect={(e) => e.preventDefault()} className="min-h-9">
                    {(c.columnDef.meta as { label?: string } | undefined)?.label ?? c.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {bulk && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-blue-tint px-4 py-2" role="region" aria-label="Bulk actions">
          <p className="t-label text-navy">
            {selected.length} selected
          </p>
          {bulk(selected, () => setRowSelection({}))}
          <Button variant="ghost" size="sm" className="h-10" onClick={() => setRowSelection({})}>
            Clear selection
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {override === "loading" ? (
          <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : override === "error" ? (
          <ErrorState onRetry={() => useStore.getState().setStateOverride("none")} />
        ) : (
          <Table aria-label={label} className="text-[13.5px]">
            <TableHeader className="bg-sky">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent">
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} className="h-11 px-3 text-[12.5px] font-semibold text-navy" style={h.column.columnDef.size && h.id === "select" ? { width: h.column.columnDef.size } : undefined}>
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {override !== "empty" &&
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className={cn("h-12 border-line data-[state=selected]:bg-blue-tint/60", rowHref && "cursor-pointer hover:bg-sky")}
                    onClick={rowHref ? (e) => {
                      if ((e.target as HTMLElement).closest("a,button,input,select,[role=checkbox],[role=menuitem]")) return
                      router.push(rowHref(row.original))
                    } : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-1.5 text-slate">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
        {override !== "loading" && override !== "error" && (override === "empty" || filtered === 0) && <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} className="py-8" />}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate">
        <p className="tnum">
          {filtered === data.length ? `${data.length} rows` : `${filtered} of ${data.length} rows`}
          {bulk ? ` · ${selected.length} selected` : ""}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <p className="tnum">
            Page {pageCount ? pageIndex + 1 : 0} of {pageCount}
          </p>
          <Button variant="secondary" size="md" className="w-11 px-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="secondary" size="md" className="w-11 px-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}
