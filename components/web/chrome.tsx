"use client"
// Site-wide chrome for public pages: W-23 cookie banner, W-25 Chat with Answerd, W-26 smart app banner.
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { create } from "zustand"
import { Cookie, MessageCircle, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { AskChat } from "@/components/answerd/AskChat"
import { ToggleRow } from "@/components/answerd/Fields"
import { Mark, AppIcon } from "@/components/brand/Mark"
import { cn } from "@/lib/utils"

// ------------------------------------------------------------------ chat widget state

export const useChatWidget = create<{ open: boolean; initial: string | null; key: number; openWith: (q?: string | null) => void; close: () => void }>((set) => ({
  open: false,
  initial: null,
  key: 0,
  openWith: (q) => set((s) => ({ open: true, initial: q ?? null, key: q ? s.key + 1 : s.key })),
  close: () => set({ open: false }),
}))

/** Web links for Ask Answerd cards (Q-04): the normal web flows. */
export const WEB_ASK_LINKS = {
  call: (slug: string) => `/b/${slug}?call=1`,
  message: (slug: string, text: string) => `/b/${slug}?message=1${text ? `&text=${encodeURIComponent(text)}` : ""}`,
  book: (slug: string) => `/b/${slug}/book`,
  listing: (slug: string) => `/b/${slug}`,
}

/** W-25: floating "Chat with Answerd" pill opening a 380-wide panel running Q-01 to Q-06. */
function ChatWidget() {
  const { open, initial, key, openWith, close } = useChatWidget()
  const router = useRouter()
  const pathname = usePathname()
  const panelRef = React.useRef<HTMLDivElement>(null)
  // Listings have a sticky Call / Message / Book bar below 1024 px; sit above it.
  const raised = /^\/b\/[^/]+$/.test(pathname)
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus()
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])
  // Close when the page changes (card actions navigate to W-06 and the booking flow)
  const prevPath = React.useRef(pathname)
  React.useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      close()
    }
  }, [pathname, close])

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => openWith(null)}
          className={cn("no-print fixed bottom-4 right-4 z-[60] inline-flex h-12 items-center gap-2 rounded-full bg-blue pl-2 pr-5 t-label font-semibold text-white shadow-overlay hover:bg-blue-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue", raised && "max-lg:bottom-24")}
          aria-haspopup="dialog"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-white">
            <Mark size={22} />
          </span>
          Chat with Answerd
        </button>
      )}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Chat with Answerd"
          className="fixed inset-0 z-[85] flex flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(640px,calc(100dvh-2rem))] sm:w-[380px] sm:rounded-3xl sm:border sm:border-line sm:shadow-overlay"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Mark size={32} />
            <div className="min-w-0 flex-1">
              <p className="t-subhead">Chat with Answerd</p>
              <p className="t-caption text-muted-ink">Powered by AskBridge</p>
            </div>
            <button type="button" onClick={close} aria-label="Close chat" className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky">
              <X className="size-5" />
            </button>
          </div>
          <AskChat
            key={key}
            initial={initial}
            compact
            links={WEB_ASK_LINKS}
            onGuestLimit={() => {
              close()
              router.push(`/sign-in?next=${encodeURIComponent(pathname)}&reason=ask`)
            }}
            className="min-h-0 flex-1"
          />
        </div>
      )}
    </>
  )
}

// ------------------------------------------------------------------ cookie banner

/** W-23: Accept all and Reject non-essential with equal weight; Manage opens toggles. Stored in session.cookieConsent. */
function CookieBanner() {
  const hydrated = useStore((s) => s.hydrated)
  const consent = useStore((s) => s.session.cookieConsent)
  const setConsent = useStore((s) => s.setCookieConsent)
  const [manage, setManage] = React.useState(false)
  const [analytics, setAnalytics] = React.useState(false)
  const [marketing, setMarketing] = React.useState(false)
  if (!hydrated || consent) return null
  const equal = "inline-flex h-11 shrink-0 sm:flex-1 items-center justify-center whitespace-nowrap rounded-full border-2 border-navy bg-white px-5 t-label font-semibold text-navy hover:bg-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
  return (
    <section
      role="region"
      aria-label="Cookie choices"
      data-cookie-banner
      className="no-print fixed inset-x-3 bottom-[68px] z-[75] rounded-2xl border border-line bg-white p-4 shadow-overlay sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-[min(760px,calc(100%-3rem))] sm:-translate-x-1/2 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue sm:inline-flex">
          <Cookie className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="t-subhead">Cookies on Answerd</h2>
          <p className="mt-1 t-label font-normal text-slate">
            We use essential cookies to keep you signed in and remember your choices. With your OK we&apos;d also use analytics and marketing cookies. Nothing non-essential runs until you choose.{" "}
            <Link href="/legal/cookies" className="text-blue underline-offset-2 hover:underline">
              Cookie policy
            </Link>
          </p>
          {manage && (
            <div className="mt-3 divide-y divide-line rounded-xl border border-line px-3">
              <ToggleRow label="Essential" description="Sign-in, security and your cookie choice. Always on." checked onChange={() => {}} disabled />
              <ToggleRow label="Analytics" description="Helps us see which pages work, in aggregate." checked={analytics} onChange={setAnalytics} />
              <ToggleRow label="Marketing" description="Lets us measure our adverts on other sites." checked={marketing} onChange={setMarketing} />
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" className={equal} onClick={() => setConsent({ analytics: true, marketing: true })}>
              Accept all
            </button>
            <button type="button" className={equal} onClick={() => setConsent({ analytics: false, marketing: false })}>
              Reject non-essential
            </button>
            {manage ? (
              <button type="button" className="inline-flex h-11 items-center justify-center rounded-full bg-blue px-5 t-label font-semibold text-white hover:bg-blue-hover" onClick={() => setConsent({ analytics, marketing })}>
                Save choices
              </button>
            ) : (
              <button type="button" className="inline-flex h-11 items-center justify-center rounded-full px-4 t-label text-navy underline-offset-2 hover:bg-sky hover:underline" onClick={() => setManage(true)} aria-expanded={manage}>
                Manage
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------ smart banner

/** Maps a public URL to the matching app screen (answerd.vitalos.co.uk/b/swift-plumbing opens C-16). */
export function appPathFor(pathname: string, search = "") {
  const m = pathname.match(/^\/b\/([^/]+)/)
  if (m) return `/app/b/${m[1]}`
  if (pathname === "/search") return `/app/results${search}`
  if (pathname.startsWith("/review/")) return "/app/bookings"
  if (pathname === "/claim") return "/app/biz/claim"
  return "/app"
}

/** W-26: smart banner at mobile widths on every public page. */
export function SmartBanner() {
  const [dismissed, setDismissed] = React.useState(false)
  const pathname = usePathname()
  if (dismissed) return null
  return (
    <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-2 md:hidden" data-smart-banner>
      <button type="button" onClick={() => setDismissed(true)} aria-label="Close app banner" className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-ink hover:bg-sky">
        <X className="size-4" />
      </button>
      <AppIcon size={40} />
      <div className="min-w-0 flex-1 max-[419px]:sr-only">
        <p className="truncate t-label font-semibold text-navy">Answerd: local services</p>
        <p className="truncate t-caption text-muted-ink">Free on iPhone and Android</p>
      </div>
      <Link href={appPathFor(pathname)} className="ml-auto inline-flex h-11 shrink-0 items-center rounded-full bg-blue px-4 t-label font-semibold text-white hover:bg-blue-hover">
        Open in the Answerd app
      </Link>
    </div>
  )
}

// ------------------------------------------------------------------ query hooks (?chat=open, ?cookies=reset)

function QueryEffects() {
  const sp = useSearchParams()
  const hydrated = useStore((s) => s.hydrated)
  const openWith = useChatWidget((s) => s.openWith)
  const chat = sp.get("chat")
  const cookies = sp.get("cookies")
  React.useEffect(() => {
    if (chat === "open") openWith(sp.get("ask"))
  }, [chat, openWith, sp])
  React.useEffect(() => {
    if (hydrated && cookies === "reset") useStore.getState().setCookieConsent(null)
  }, [hydrated, cookies])
  return null
}

export function SiteChrome() {
  return (
    <>
      <React.Suspense fallback={null}>
        <QueryEffects />
      </React.Suspense>
      <CookieBanner />
      <ChatWidget />
    </>
  )
}

/** Small "Ask Answerd" trigger used in empty states. */
export function AskAnswerdButton({ query, className, children }: { query?: string; className?: string; children?: React.ReactNode }) {
  const openWith = useChatWidget((s) => s.openWith)
  return (
    <button type="button" onClick={() => openWith(query || null)} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue px-5 t-label font-semibold text-white hover:bg-blue-hover", className)}>
      <MessageCircle className="size-[18px]" aria-hidden />
      {children ?? "Ask Answerd"}
    </button>
  )
}
