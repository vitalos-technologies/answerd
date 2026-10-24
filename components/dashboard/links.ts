// Routes the reusable business components link to when they run inside the web dashboard (W-13 to W-19).
import type { OpsLinks } from "@/components/biz/ops/links"
import type { DeskLinks } from "@/components/biz/desk/common"
import type { SetupStep } from "@/components/app/biz"

export const PROFILE_TABS = [
  { value: "details", label: "Details" },
  { value: "services", label: "Services" },
  { value: "hours", label: "Hours" },
  { value: "area", label: "Service area" },
  { value: "photos", label: "Photos" },
  { value: "credentials", label: "Credentials" },
  { value: "booking", label: "Booking settings" },
] as const
export type ProfileTab = (typeof PROFILE_TABS)[number]["value"]

export const DESK_TABS = [
  { value: "overview", label: "Overview" },
  { value: "setup", label: "Setup" },
  { value: "knowledge", label: "Knowledge" },
  { value: "handoff", label: "Handoff" },
  { value: "test", label: "Test call" },
] as const
export type DeskTab = (typeof DESK_TABS)[number]["value"] | "intro"

export const profileHref = (tab: ProfileTab = "details") => `/dashboard/profile?tab=${tab}`
export const deskHref = (tab: DeskTab = "overview") => (tab === "overview" ? "/dashboard/desk" : `/dashboard/desk?tab=${tab}`)
export const PORTAL_HREF = "/dashboard/billing/portal"

export const dashOpsLinks: OpsLinks = {
  today: "/dashboard",
  inbox: "/dashboard/inbox",
  diary: "/dashboard/diary",
  thread: (id) => `/dashboard/inbox?thread=${id}`,
  quote: (id) => `/dashboard/inbox?thread=${id}&quote=1`,
  call: (id) => `/dashboard/inbox?call=${id}`,
  request: (id) => `/dashboard/inbox?request=${id}`,
  job: (id) => `/dashboard/diary?job=${id}`,
  newDiary: (at) => `/dashboard/diary?new=${at ? encodeURIComponent(at) : "now"}`,
  desk: "/dashboard/desk",
  setup: "/dashboard/profile",
  billing: "/dashboard/billing",
  reviews: "/dashboard/reviews",
  stats: "/dashboard/stats",
  share: "/dashboard/reviews#share",
  printCard: "/print/review-card?clean=1",
}

export const dashDeskLinks: DeskLinks = {
  call: dashOpsLinks.call,
  thread: dashOpsLinks.thread,
  job: dashOpsLinks.job,
  request: dashOpsLinks.request,
  diary: dashOpsLinks.diary,
  inbox: dashOpsLinks.inbox,
  billing: dashOpsLinks.billing,
  setup: deskHref("setup"),
  testCall: deskHref("test"),
  intro: deskHref("intro"),
  knowledge: deskHref("knowledge"),
  handoff: deskHref("handoff"),
  profile: {
    details: profileHref("details"),
    services: profileHref("services"),
    hours: profileHref("hours"),
    area: profileHref("area"),
    booking: profileHref("booking"),
    credentials: profileHref("credentials"),
  },
}

/** B-09 steps point at app routes; on the web they open the matching W-16 tab (or W-17 for the desk). */
export function setupStepHref(step: SetupStep) {
  if (step.key === "desk") return deskHref("intro")
  const tab = PROFILE_TABS.find((t) => t.value === step.key)
  return profileHref(tab?.value ?? "details")
}
