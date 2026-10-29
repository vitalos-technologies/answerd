"use client"
import * as React from "react"
import Link from "next/link"
import Script from "next/script"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { fill } from "@/lib/fill"
import type { pages } from "@/content/pages"
import { MESSAGE_MAX, type FieldErrors, type Topic } from "@/lib/enquiry"
import { Field, Note, btnPrimary, btnSecondary, inputCls, linkCls } from "./form"

type Copy = (typeof pages)["contact"]
type Values = { topic: Topic; name: string; email: string; company: string; message: string; website: string }
const EMPTY: Values = { topic: "customer", name: "", email: "", company: "", message: "", website: "" }

/** Cloudflare Turnstile, when the site key is set. The admin inbox checks the token when it has the secret. */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void }
  }
}

function errorText(copy: Copy, field: keyof FieldErrors, code: NonNullable<FieldErrors[keyof FieldErrors]>) {
  const group = copy.errors[code] as Record<string, string>
  return group[field] ? fill(group[field], { max: MESSAGE_MAX }) : undefined
}

/** The contact form: posts to /api/contact, which relays it to the Vitalos admin inbox. */
export function ContactForm({ copy, email }: { copy: Copy; email: string }) {
  const [values, setValues] = React.useState<Values>(EMPTY)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "unavailable" | "verify">("idle")
  const [ref, setRef] = React.useState<string | null>(null)
  const [token, setToken] = React.useState("")
  const turnstileEl = React.useRef<HTMLDivElement>(null)
  const turnstileId = React.useRef<string | null>(null)
  const done = React.useRef<HTMLHeadingElement>(null)
  const summary = React.useRef<HTMLDivElement>(null)

  const renderTurnstile = React.useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileEl.current || !window.turnstile || turnstileId.current) return
    turnstileId.current = window.turnstile.render(turnstileEl.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action: "answerd-contact",
      callback: (t: string) => setToken(t),
      "expired-callback": () => setToken(""),
    })
  }, [])
  React.useEffect(renderTurnstile, [renderTurnstile])
  React.useEffect(() => {
    if (status === "sent") done.current?.focus()
    if (status === "unavailable" || status === "verify") summary.current?.focus()
  }, [status])

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const local: FieldErrors = {}
    if (!values.name.trim()) local.name = "required"
    if (!values.email.trim()) local.email = "required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) local.email = "invalid"
    if (!values.message.trim()) local.message = "required"
    else if ([...values.message.trim()].length > MESSAGE_MAX) local.message = "tooLong"
    setErrors(local)
    if (Object.keys(local).length) {
      document.getElementById(`contact-${Object.keys(local)[0]}`)?.focus()
      return
    }
    if (TURNSTILE_SITE_KEY && !token) {
      setStatus("verify")
      return
    }
    setStatus("sending")
    const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, turnstileToken: token }) }).catch(() => null)
    const data = res ? ((await res.json().catch(() => ({}))) as { ref?: string; errors?: FieldErrors }) : {}
    if (res && (res.status === 201 || res.ok)) {
      setRef(data.ref ?? null)
      setStatus("sent")
      return
    }
    if (window.turnstile && turnstileId.current) window.turnstile.reset(turnstileId.current)
    setToken("")
    if (res?.status === 400 && data.errors && Object.keys(data.errors).length) {
      setErrors(data.errors)
      setStatus("idle")
      document.getElementById(`contact-${Object.keys(data.errors)[0]}`)?.focus()
      return
    }
    setStatus(res?.status === 400 ? "verify" : "unavailable")
  }

  if (status === "sent")
    return (
      <div className="text-center">
        <span aria-hidden className="mx-auto grid size-16 place-items-center rounded-full bg-teal-tint text-teal-ink">
          <CheckCircle2 className="size-9" />
        </span>
        <h2 ref={done} tabIndex={-1} className="mt-4 text-[28px] leading-9 font-bold text-navy outline-none">
          {copy.sentTitle}
        </h2>
        <p className="mt-2 text-slate">{fill(copy.sentBody, { name: values.name.trim().split(/\s+/)[0]!, email: values.email.trim() })}</p>
        {ref && <p className="tnum mt-1 text-slate">{fill(copy.sentRef, { ref })}</p>}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" className={btnSecondary} onClick={() => { setValues(EMPTY); setErrors({}); setRef(null); turnstileId.current = null; setStatus("idle") }}>
            {copy.another}
          </button>
          <Link href="/" className={btnSecondary}>
            {copy.home}
          </Link>
        </div>
      </div>
    )

  const err = (f: keyof FieldErrors) => (errors[f] ? errorText(copy, f, errors[f]!) : undefined)
  const sending = status === "sending"

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      {TURNSTILE_SITE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={renderTurnstile} />}
      <div ref={summary} tabIndex={-1} className="outline-none">
        {status === "unavailable" && <Note tone="error">{fill(copy.errors.unavailable, { email })}</Note>}
        {status === "verify" && <Note tone="error">{copy.errors.verify}</Note>}
        {Object.keys(errors).length > 0 && status === "idle" && <Note tone="error">{copy.errors.check}</Note>}
      </div>

      <fieldset>
        <legend className="text-[15px] leading-5 font-semibold text-navy">{copy.topicLegend}</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {copy.topics.map((t) => (
            <label key={t.value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 text-[15px] text-navy has-[:checked]:border-blue has-[:checked]:bg-blue-tint has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-blue">
              <input type="radio" name="topic" value={t.value} checked={values.topic === t.value} onChange={() => setValues((v) => ({ ...v, topic: t.value as Topic }))} className="size-4 accent-blue" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={copy.name} htmlFor="contact-name" error={err("name")}>
          <input id="contact-name" name="name" autoComplete="name" value={values.name} onChange={set("name")} maxLength={200} aria-invalid={!!errors.name || undefined} aria-describedby={errors.name ? "contact-name-msg" : undefined} className={inputCls} />
        </Field>
        <Field label={copy.email} htmlFor="contact-email" hint={copy.emailHint} error={err("email")}>
          <input id="contact-email" name="email" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set("email")} maxLength={254} aria-invalid={!!errors.email || undefined} aria-describedby="contact-email-msg" className={inputCls} />
        </Field>
      </div>

      <Field label={copy.company} htmlFor="contact-company" optional={copy.optional} error={err("company")}>
        <input id="contact-company" name="company" autoComplete="organization" value={values.company} onChange={set("company")} maxLength={200} aria-invalid={!!errors.company || undefined} aria-describedby={errors.company ? "contact-company-msg" : undefined} className={inputCls} />
      </Field>

      <Field label={copy.message} htmlFor="contact-message" hint={fill(copy.messageHint, { max: MESSAGE_MAX.toLocaleString("en-GB") })} error={err("message")}>
        <textarea id="contact-message" name="message" rows={7} value={values.message} onChange={set("message")} aria-invalid={!!errors.message || undefined} aria-describedby="contact-message-msg" className={cn(inputCls, "h-auto min-h-40 py-3 leading-6")} />
      </Field>

      {/* Honeypot: hidden from people and screen readers; bots fill every field. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>

      {TURNSTILE_SITE_KEY && <div ref={turnstileEl} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px] leading-5 text-muted-ink">
          {copy.privacy}{" "}
          <Link href="/privacy" className={linkCls}>
            {copy.privacyLink}
          </Link>
          .
        </p>
        <button type="submit" className={btnPrimary} disabled={sending} aria-busy={sending || undefined}>
          {sending ? copy.sending : copy.send}
        </button>
      </div>
    </form>
  )
}
