"use client"
import * as React from "react"
import Link from "next/link"
import { ChevronDown, Flag, MessageSquare, Search } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { Field, TextArea, TextInput } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const FAQS = [
  { q: "How do I cancel a booking?", a: "Open Bookings, choose the booking and tap Cancel. It's free until the time shown in the business's policy, usually 24 hours before." },
  { q: "What does “Responds instantly” mean?", a: "The business uses an Answerd desk, an AI assistant that replies to calls and messages straight away and hands anything tricky to the owner." },
  { q: "Is the Answerd desk a real person?", a: "No. It's always labelled “Answerd desk” and says it's an AI. The business can take over any conversation." },
  { q: "How do I pay?", a: "You pay the business directly after the job. Answerd is free for customers." },
  { q: "Who can leave reviews?", a: "Only customers who completed a booking, or had a call over a minute through Answerd." },
  { q: "The business didn't turn up. What now?", a: "Open the booking and tap Get help, or message the business. If they marked you as a no-show by mistake you can dispute it within 48 hours." },
  { q: "How do I change my number?", a: "Account, then Edit profile. We'll text a code to your new number." },
  { q: "How do I delete my account?", a: "Account, Privacy and data, Delete account. Future bookings are cancelled and the businesses told." },
]

/** C-44: search FAQs, top questions, contact support, report a problem. */
export default function HelpPage() {
  const s = useStore()
  const [q, setQ] = React.useState("")
  const [open, setOpen] = React.useState<number | null>(0)
  const [contact, setContact] = React.useState(false)
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const list = FAQS.filter((f) => (f.q + f.a).toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <AppScreen id="C-44" header={<TopBar title="Help" back />}>
      <div className="space-y-4 p-4">
        <label className="flex h-12 items-center gap-2 rounded-full border border-line bg-white px-4 focus-within:border-blue">
          <Search className="size-4 text-muted-ink" aria-hidden />
          <span className="sr-only">Search help</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help" className="h-full flex-1 bg-transparent t-body text-navy outline-none placeholder:text-muted-ink" />
        </label>
        <section className="card divide-y divide-line overflow-hidden" aria-label="Top questions">
          {list.map((f, i) => (
            <div key={f.q}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left t-label text-navy hover:bg-sky">
                <span className="flex-1">{f.q}</span>
                <ChevronDown className={cn("size-5 text-muted-ink transition-transform", open === i && "rotate-180")} aria-hidden />
              </button>
              {open === i && <p className="px-4 pb-4 t-body text-slate">{f.a}</p>}
            </div>
          ))}
          {!list.length && <p className="p-4 t-label font-normal text-slate">No answers match. Contact support and we&apos;ll help.</p>}
        </section>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setContact(true)}>
            <MessageSquare /> Contact support
          </Button>
          <Link href="/app/report?target=user&id=app" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-white t-label font-semibold text-navy hover:bg-sky">
            <Flag className="size-5" aria-hidden /> Report a problem
          </Link>
        </div>
      </div>
      <BottomSheet open={contact} onClose={() => setContact(false)} title="Contact support">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!subject.trim() || body.trim().length < 10) return toast("Add a subject and a few words")
            s.submitTicket(subject.trim(), body.trim())
            setContact(false)
            setSubject("")
            setBody("")
            toast("Thanks, we'll reply within 1 working day")
          }}
        >
          <Field label="Subject" htmlFor="sub">
            <TextInput id="sub" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="How can we help?" htmlFor="body">
            <TextArea id="body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <Button block type="submit">
            Send
          </Button>
        </form>
      </BottomSheet>
    </AppScreen>
  )
}
