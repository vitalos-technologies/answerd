"use client"
import { use } from "react"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { ConversationView } from "@/components/biz/ops/Conversation"

/** B-20 Conversation. */
export default function Conversation({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params)
  return (
    <OpsScreen id="B-20" bodyClassName="flex flex-col overflow-hidden">
      {() => <ConversationView threadId={threadId} back="/app/biz/inbox" />}
    </OpsScreen>
  )
}
