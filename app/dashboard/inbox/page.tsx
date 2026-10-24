"use client"
import { withSuspense } from "@/components/app/helpers"
import { DashPage } from "@/components/dashboard/kit"
import { InboxPanes } from "@/components/dashboard/InboxPanes"

/** W-14 Dashboard inbox: filters, thread list and conversation side by side. */
function InboxPage() {
  return (
    <DashPage id="W-14" title="Inbox" className="max-w-none" headerSrOnlyFromLg>
      {({ listing }) => <InboxPanes listingId={listing.id} />}
    </DashPage>
  )
}

export default withSuspense(InboxPage)
