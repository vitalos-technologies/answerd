"use client"
import { use } from "react"
import { useRouter } from "next/navigation"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { QuoteForm } from "@/components/biz/ops/QuoteForm"
import { EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"

/** B-26 Send quote. */
export default function SendQuote({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params)
  const router = useRouter()
  const back = `/app/biz/inbox/${threadId}`
  return (
    <OpsScreen id="B-26" title="Send quote" back={back} bg="white">
      {({ s, listing }) => {
        const thread = s.threads.find((t) => t.id === threadId && t.listingId === listing.id)
        if (!thread) return <EmptyState title="Conversation not found" body="Quotes are sent from a conversation." action={<ButtonLink href="/app/biz/inbox" size="md">Inbox</ButtonLink>} />
        return (
          <div className="px-4 pb-8 pt-4">
            <p className="mb-4 t-label font-normal text-slate">
              To <span className="font-semibold text-navy">{thread.customerName}</span>
              <span className="block">It appears in your conversation as a quote card they can accept.</span>
            </p>
            <QuoteForm threadId={threadId} onSent={() => router.push(back)} onCancel={() => router.push(back)} />
          </div>
        )
      }}
    </OpsScreen>
  )
}
