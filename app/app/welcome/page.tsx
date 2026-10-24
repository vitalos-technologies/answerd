"use client"
import * as React from "react"
import Link from "next/link"
import { CalendarCheck, MessageCircle, Phone, Search, Star } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { Mark } from "@/components/brand/Mark"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { signInHref } from "@/components/app/helpers"

const SLIDES = [
  { title: "Local services always within reach.", body: "Plumbers, cleaners, mechanics, barbers: whoever you need, near you." },
  { title: "Call, message or book in two taps.", body: "See prices and free times, then get in touch your way." },
  { title: "Businesses that actually pick up.", body: "Look for Responds instantly: their Answerd desk replies in a minute, day or night." },
]

function Illustration({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="relative mx-auto size-56">
        <div className="absolute inset-6 rounded-full bg-blue-tint" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Mark size={96} />
        </div>
        {["Wrench", "Sparkles", "Car", "Scissors"].map((_, k) => {
          const pos = ["left-0 top-6", "right-0 top-10", "left-4 bottom-4", "right-6 bottom-2"][k]
          const Icon = [Search, Star, MapPinIcon, CalendarCheck][k]!
          return (
            <span key={k} className={cn("absolute inline-flex size-12 items-center justify-center rounded-2xl bg-white text-blue shadow-card", pos)}>
              <Icon className="size-6" aria-hidden />
            </span>
          )
        })}
      </div>
    )
  if (i === 1)
    return (
      <div className="mx-auto flex h-56 w-64 flex-col justify-center gap-3">
        {[
          { icon: Phone, label: "Call", primary: false },
          { icon: MessageCircle, label: "Message", primary: false },
          { icon: CalendarCheck, label: "Book", primary: true },
        ].map((b) => (
          <span key={b.label} className={cn("flex h-14 items-center gap-3 rounded-full px-5 t-subhead shadow-card", b.primary ? "bg-blue text-white" : "bg-white text-navy")}>
            <b.icon className="size-5" aria-hidden /> {b.label}
          </span>
        ))}
      </div>
    )
  return (
    <div className="mx-auto flex h-56 w-72 flex-col justify-center gap-2.5">
      <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-blue px-3.5 py-2.5 text-white t-label font-normal">Are you free this week?</div>
      <div className="flex items-end gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-full border border-line bg-white">
          <Mark size={22} />
        </span>
        <div>
          <p className="px-1 t-caption text-teal-ink">Answerd desk</p>
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-teal-tint px-3.5 py-2.5 text-navy t-label font-normal">Yes: Thursday 10am or 2pm are free. Shall I book one?</div>
        </div>
      </div>
      <span className="ml-10 inline-flex w-fit items-center gap-1.5 rounded-full bg-teal px-2.5 py-1 t-caption text-navy">
        <span className="size-1.5 rounded-full bg-white" /> Responds instantly
      </span>
    </div>
  )
}

function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

/** C-02: three swipeable slides, Get started, I have an account, I run a business. */
export default function WelcomePage() {
  const [i, setI] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)
  const router = useRouter()
  const userId = useStore((s) => s.session.userId)
  const go = (n: number) => {
    const el = ref.current
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" })
  }
  return (
    <AppScreen id="C-02" bg="white">
      <div className="flex h-full flex-col">
        <div
          ref={ref}
          onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto"
          aria-roledescription="carousel"
          aria-label="Welcome to Answerd"
        >
          {SLIDES.map((s, k) => (
            <section key={k} className="flex w-full shrink-0 snap-center flex-col justify-center px-6" aria-roledescription="slide" aria-label={`${k + 1} of 3`}>
              <Illustration i={k} />
              <h1 className="t-display mt-8">{s.title}</h1>
              <p className="mt-3 t-body text-slate">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="flex justify-center gap-2 py-4" role="tablist" aria-label="Slides">
          {SLIDES.map((_, k) => (
            <button key={k} type="button" role="tab" aria-selected={i === k} aria-label={`Slide ${k + 1}`} onClick={() => go(k)} className="inline-flex size-6 items-center justify-center">
              <span className={cn("h-2 rounded-full transition-all", i === k ? "w-6 bg-blue" : "w-2 bg-line")} />
            </button>
          ))}
        </div>
        <div className="space-y-2 px-4 pb-6">
          <Button block onClick={() => router.push("/app/onboarding/location")}>
            Get started
          </Button>
          <Button block variant="secondary" onClick={() => router.push(signInHref("/app"))}>
            I have an account
          </Button>
          <Link href={userId ? "/app/biz/claim" : signInHref("/app/biz/claim")} className="flex h-11 items-center justify-center t-label text-blue hover:underline">
            I run a business
          </Link>
        </div>
      </div>
    </AppScreen>
  )
}
