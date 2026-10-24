"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { InboxFilters, InboxList, INBOX_FILTERS } from "@/components/biz/ops/Inbox"
import { inboxItems, type InboxFilter } from "@/components/biz/ops/data"
import { withSuspense } from "@/components/app/helpers"

/** B-19 Inbox: filters All, Needs you, Desk handled, Calls, Booking requests. */
function Inbox() {
  const router = useRouter()
  const sp = useSearchParams()
  const raw = sp.get("filter") as InboxFilter | null
  const filter: InboxFilter = INBOX_FILTERS.some((f) => f.value === raw) ? raw! : "all"
  return (
    <OpsScreen id="B-19" tabs>
      {({ s, listing }) => (
        <div className="px-4 pb-6 pt-4">
          <h1 className="t-title">Inbox</h1>
          <p className="t-label font-normal text-slate">Calls, texts, app messages and booking requests in one place.</p>
          <InboxFilters
            className="-mx-4 mt-3 px-4 pb-1"
            value={filter}
            onChange={(f) => router.replace(f === "all" ? "/app/biz/inbox" : `/app/biz/inbox?filter=${f}`, { scroll: false })}
            counts={{ needs: inboxItems(s, listing.id, "needs").length, requests: inboxItems(s, listing.id, "requests").length }}
          />
          <InboxList className="mt-3" listingId={listing.id} filter={filter} />
        </div>
      )}
    </OpsScreen>
  )
}

export default withSuspense(Inbox)
