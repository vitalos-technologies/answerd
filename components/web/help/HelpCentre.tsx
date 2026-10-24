"use client"
import * as React from "react"
import { ChevronDown, Search, Send } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { Field, SelectInput, TextArea, TextInput } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { HELP_ARTICLES, searchArticles } from "./articles"
import { AskAnswerdButton } from "../chrome"

/** W-20: search over the seeded articles, grouped for customers and businesses, and a contact form. */
export function HelpCentre() {
  const s = useStore()
  const [q, setQ] = React.useState("")
  const [aud, setAud] = React.useState<"all" | "customers" | "businesses">("all")
  const found = searchArticles(q).filter((a) => aud === "all" || a.audience === aud)
  const user = s.users.find((u) => u.id === s.session.userId)
  const [topic, setTopic] = React.useState("A booking")
  const [email, setEmail] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [errors, setErrors] = React.useState<{ email?: string; message?: string }>({})
  const [sent, setSent] = React.useState(false)
  const contactEmail = email || user?.email || ""

  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-10 max-sm:px-4 md:py-14">
          <h1 className="t-display">How can we help?</h1>
          <form role="search" className="mt-6 max-w-2xl" onSubmit={(e) => e.preventDefault()}>
            <label className="flex h-[52px] items-center gap-2.5 rounded-full border border-line bg-white px-4 shadow-card focus-within:border-blue">
              <Search className="size-5 shrink-0 text-navy" aria-hidden />
              <span className="sr-only">Search help articles</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help, e.g. cancel, review, desk" className="h-full min-w-0 flex-1 bg-transparent t-body text-navy outline-none placeholder:text-muted-ink" />
            </label>
          </form>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Show articles for">
            {(
              [
                ["all", "All"],
                ["customers", "For customers"],
                ["businesses", "For businesses"],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={aud === v} onClick={() => setAud(v)} className={cn("inline-flex h-11 items-center rounded-full border px-4 t-label", aud === v ? "border-blue bg-blue-tint text-navy" : "border-line bg-white text-navy hover:border-blue")}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-10 max-sm:px-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="art-h" className="min-w-0">
          <h2 id="art-h" className="t-heading tnum" aria-live="polite">
            {q ? `${found.length} ${found.length === 1 ? "article" : "articles"} for “${q}”` : `${found.length} articles`}
          </h2>
          {found.length ? (
            (["customers", "businesses"] as const).map((group) => {
              const list = found.filter((a) => a.audience === group)
              if (!list.length) return null
              return (
                <div key={group} className="mt-6">
                  <h3 className="t-subhead">{group === "customers" ? "For customers" : "For businesses"}</h3>
                  <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
                    {list.map((a) => (
                      <details key={a.slug} id={a.slug} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 t-label text-navy">
                          {a.title}
                          <ChevronDown className="size-5 shrink-0 text-muted-ink transition-transform group-open:rotate-180" aria-hidden />
                        </summary>
                        <div className="space-y-2 pb-4">
                          {a.body.map((p, i) => (
                            <p key={i} className="t-body text-slate">
                              {p}
                            </p>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="card mt-6">
              <EmptyState title="No articles match" body="Try a different word, ask Answerd, or send us a message." action={<AskAnswerdButton query={q} />} />
            </div>
          )}
          <p className="mt-6 t-caption text-muted-ink tnum">{HELP_ARTICLES.length} articles in total.</p>
        </section>

        <section id="contact" aria-labelledby="contact-h" className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-6">
            <h2 id="contact-h" className="t-heading">
              Contact us
            </h2>
            {sent ? (
              <div className="mt-3">
                <p className="t-body text-slate">Thanks. We&apos;ve got your message and will reply by email within 1 working day.</p>
                <Button variant="secondary" size="md" className="mt-4" onClick={() => setSent(false)}>
                  Send another
                </Button>
              </div>
            ) : (
              <form
                className="mt-4 space-y-4"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  const errs: typeof errors = {}
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) errs.email = "Enter an email so we can reply"
                  if (message.trim().length < 10) errs.message = "Tell us a bit more (at least 10 characters)"
                  setErrors(errs)
                  if (Object.keys(errs).length) return
                  s.submitTicket(topic, `${message.trim()}\n\nReply to: ${contactEmail.trim()}`)
                  toast("Message sent. We'll reply within 1 working day.")
                  setMessage("")
                  setSent(true)
                }}
              >
                <Field label="What's it about?" htmlFor="ct-topic">
                  <SelectInput id="ct-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                    {["A booking", "My account", "A business or review", "Claiming or my listing", "The AI desk", "Billing", "Something else"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Email" htmlFor="ct-email" error={errors.email}>
                  <TextInput id="ct-email" type="email" value={contactEmail} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
                </Field>
                <Field label="Message" htmlFor="ct-msg" error={errors.message}>
                  <TextArea id="ct-msg" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} aria-invalid={!!errors.message} />
                </Field>
                <Button type="submit" block>
                  <Send /> Send message
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
