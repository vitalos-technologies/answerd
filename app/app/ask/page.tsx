"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { AskChat } from "@/components/answerd/AskChat"
import { Mark } from "@/components/brand/Mark"
import { signInHref, withSuspense } from "@/components/app/helpers"

/** C-38: Ask Answerd (Q-01 to Q-06), powered by AskBridge. */
function AskPage() {
  const router = useRouter()
  const initial = useSearchParams().get("q")
  return (
    <AppScreen
      id="C-38"
      bg="white"
      header={
        <TopBar
          back
          title={
            <span className="flex items-center gap-2">
              <Mark size={28} /> Ask Answerd
            </span>
          }
          subtitle="Powered by AskBridge"
        />
      }
      bodyClassName="overflow-hidden"
    >
      <AskChat
        initial={initial}
        onGuestLimit={() => router.push(signInHref("/app/ask"))}
        links={{
          call: (slug) => `/app/b/${slug}/call`,
          message: (slug, text, postcode) => `/app/b/${slug}/enquiry?text=${encodeURIComponent(text)}${postcode ? `&postcode=${encodeURIComponent(postcode)}` : ""}`,
          book: (slug) => `/app/b/${slug}/book`,
          listing: (slug) => `/app/b/${slug}`,
        }}
      />
    </AppScreen>
  )
}

export default withSuspense(AskPage)
