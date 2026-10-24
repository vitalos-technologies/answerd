"use client"
import * as React from "react"

/**
 * Where the ops components link to. The app (B-18 to B-29) uses `appLinks`;
 * the web dashboard (W-13 to W-15) wraps the same components in <OpsLinksProvider value={…}>
 * with its own routes, so nothing here depends on /app paths.
 */
export interface OpsLinks {
  today: string
  inbox: string
  diary: string
  thread: (threadId: string) => string
  quote: (threadId: string) => string
  call: (callId: string) => string
  request: (bookingId: string) => string
  job: (bookingId: string) => string
  newDiary: (at?: string) => string
  desk: string
  setup: string
  billing: string
  reviews: string
  stats: string
  share: string
  printCard: string
}

export const appLinks: OpsLinks = {
  today: "/app/biz",
  inbox: "/app/biz/inbox",
  diary: "/app/biz/diary",
  thread: (id) => `/app/biz/inbox/${id}`,
  quote: (id) => `/app/biz/inbox/${id}/quote`,
  call: (id) => `/app/biz/calls/${id}`,
  request: (id) => `/app/biz/requests/${id}`,
  job: (id) => `/app/biz/jobs/${id}`,
  newDiary: (at) => `/app/biz/diary/new${at ? `?at=${encodeURIComponent(at)}` : ""}`,
  desk: "/app/biz/desk",
  setup: "/app/biz/setup",
  billing: "/app/biz/billing",
  reviews: "/app/biz/reviews",
  stats: "/app/biz/stats",
  share: "/app/biz/share",
  printCard: "/print/review-card?clean=1",
}

const Ctx = React.createContext<OpsLinks>(appLinks)

export function OpsLinksProvider({ value, children }: { value: OpsLinks; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useOpsLinks() {
  return React.useContext(Ctx)
}
