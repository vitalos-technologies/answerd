"use client"
import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImagePlus, Phone, SendHorizontal, X } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { ListingAvatar } from "@/components/answerd/Media"
import { TypingIndicator } from "@/components/answerd/Chat"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink, IconButton } from "@/components/answerd/Button"
import { MessageList } from "@/components/app/MessageList"
import { signInHref } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { isDeskLive, replyLine } from "@/lib/selectors"

const QUICK = ["Are you free this week?", "How much for…", "Can you send a quote?"]

/** C-22: bubbles, inline cards and the desk's labelled replies. */
export default function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params)
  const s = useStore()
  const thread = s.threads.find((t) => t.id === threadId)
  const listing = s.listings.find((l) => l.id === thread?.listingId)
  const [text, setText] = React.useState("")
  const [photos, setPhotos] = React.useState<string[]>([])
  const [typing, setTyping] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement>(null)
  const count = s.messages.filter((m) => m.threadId === threadId).length
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([])

  React.useEffect(() => {
    if (thread && thread.unreadCustomer > 0) s.markThreadRead(thread.id, "customer")
  }, [thread, s])
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [count, typing])
  React.useEffect(() => () => timers.current.forEach(clearTimeout), [])

  if (!s.session.userId) {
    return (
      <AppScreen id="C-22" header={<Header />}>
        <EmptyState title="Sign in to see your messages" body="Your conversations with businesses live here." action={<ButtonLink href={signInHref(`/app/messages/${threadId}`)} size="md">Sign in</ButtonLink>} />
      </AppScreen>
    )
  }
  if (!thread || !listing || thread.customerId !== s.session.userId) {
    return (
      <AppScreen id="C-22" header={<Header />}>
        <EmptyState title="Conversation not found" body="It may belong to another account." action={<ButtonLink href="/app/messages" size="md">All messages</ButtonLink>} />
      </AppScreen>
    )
  }

  const desk = isDeskLive(s, listing) && thread.deskActive
  const send = (body: string) => {
    const b = body.trim()
    if (!b && !photos.length) return
    s.sendMessage(thread.id, "customer", b || "Photo", { attachments: photos })
    setText("")
    setPhotos([])
    if (desk && !s.offline) {
      // D-03: if the owner hasn't replied 2 s after a customer message, the desk replies
      timers.current.push(setTimeout(() => setTyping(true), 600))
      timers.current.push(
        setTimeout(() => {
          setTyping(false)
          const last = useStore.getState().messages.filter((m) => m.threadId === thread.id).at(-1)
          if (last?.author === "customer") useStore.getState().deskAutoReply(thread.id)
        }, 2000),
      )
    }
  }

  return (
    <AppScreen
      id="C-22"
      header={
        <Header
          title={listing.name}
          sub={desk ? "Answerd desk online · replies in a minute" : replyLine(s, listing)}
          online={desk}
          avatar={<ListingAvatar initials={listing.initials} hue={listing.hue} size={36} />}
          href={`/app/b/${listing.slug}`}
          callHref={`/app/b/${listing.slug}/call`}
        />
      }
      footer={
        <div className="border-t border-line bg-white px-3 pb-3 pt-2">
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => (q.endsWith("…") ? setText(q.replace("…", " ")) : send(q))} className="inline-flex h-8 shrink-0 items-center rounded-full border border-line px-3 t-caption text-navy hover:border-blue">
                {q}
              </button>
            ))}
          </div>
          {photos.length > 0 && (
            <div className="mb-2 flex gap-2">
              {photos.map((p) => (
                <span key={p} className="inline-flex h-8 items-center gap-1 rounded-full bg-sky pl-3 pr-1 t-caption text-navy">
                  {p}
                  <button type="button" aria-label={`Remove ${p}`} onClick={() => setPhotos((x) => x.filter((y) => y !== p))} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-white">
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              send(text)
            }}
          >
            <IconButton label="Attach a photo" onClick={() => setPhotos((x) => (x.length < 5 ? [...x, `photo-${x.length + 1}.jpg`] : x))}>
              <ImagePlus />
            </IconButton>
            <label className="flex min-h-11 flex-1 items-center rounded-3xl border border-line bg-sky px-4 focus-within:border-blue">
              <span className="sr-only">Message</span>
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send(text)
                  }
                }}
                placeholder="Message"
                className="max-h-28 w-full resize-none bg-transparent py-2.5 t-body text-navy outline-none placeholder:text-muted-ink"
              />
            </label>
            <button type="submit" aria-label="Send" disabled={!text.trim() && !photos.length} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-blue text-white hover:bg-blue-hover disabled:opacity-40">
              <SendHorizontal className="size-5" />
            </button>
          </form>
        </div>
      }
    >
      <div className="px-4 py-4">
        {!desk && (
          <Banner tone="info" className="mb-3" title={replyLine(s, listing)}>
            {listing.name} will see your message in their inbox.
          </Banner>
        )}
        <MessageList thread={thread} viewer="customer" />
        {typing && (
          <div className="mt-3">
            <TypingIndicator />
          </div>
        )}
        <div ref={endRef} className="h-1" />
      </div>
    </AppScreen>
  )
}

function Header({ title = "Messages", sub, online, avatar, href, callHref }: { title?: string; sub?: string; online?: boolean; avatar?: React.ReactNode; href?: string; callHref?: string }) {
  const router = useRouter()
  return (
    <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-line bg-white px-2">
      <IconButton label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push("/app/messages"))}>
        <ArrowLeft />
      </IconButton>
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="relative">
            {avatar}
            {online && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-teal" aria-hidden />}
          </span>
          <span className="min-w-0">
            <span className="block truncate t-subhead">{title}</span>
            {sub && <span className={`block truncate t-caption ${online ? "text-teal-ink" : "text-muted-ink"}`}>{sub}</span>}
          </span>
        </Link>
      ) : (
        <h1 className="flex-1 t-subhead">{title}</h1>
      )}
      {callHref && (
        <Link href={callHref} aria-label={`Call ${title}`} className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-blue-tint">
          <Phone className="size-5" />
        </Link>
      )}
    </header>
  )
}
