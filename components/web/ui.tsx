// Presentational building blocks for the public website. No hooks, so server pages can use them.
import * as React from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Faq } from "./data"

/** Web max width 1200 with a 24 px gutter (16 on phones). */
export function Container({ children, className, as: As = "div", ...rest }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "header" | "nav" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={cn("mx-auto w-full max-w-[1200px] px-6 max-sm:px-4", className)} {...rest}>
      {children}
    </As>
  )
}

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 t-caption text-muted-ink">
        {items.map((it, i) => {
          const last = i === items.length - 1
          return (
            <li key={it.href} className="inline-flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="text-navy">
                  {it.name}
                </span>
              ) : (
                <>
                  <Link href={it.href} className="inline-flex min-h-8 items-center hover:text-navy hover:underline">
                    {it.name}
                  </Link>
                  <ChevronRight className="size-3.5" aria-hidden />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Structured data. Escapes "<" so the JSON can't close the script tag. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}

export function Faqs({ faqs, title = "Questions people ask", className }: { faqs: Faq[]; title?: string; className?: string }) {
  return (
    <section className={className} aria-labelledby="faqs-h">
      <h2 id="faqs-h" className="t-heading">
        {title}
      </h2>
      <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
        {faqs.map((f) => (
          <details key={f.q} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 t-subhead">
              {f.q}
              <ChevronDown className="size-5 shrink-0 text-muted-ink transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="pb-4 t-body text-slate">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function SectionHead({ title, sub, action, id, className }: { title: string; sub?: string; action?: React.ReactNode; id?: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 id={id} className="t-heading">
          {title}
        </h2>
        {sub && <p className="mt-1 t-body text-slate">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

/** Plain link styled as a pill button (server-safe twin of ButtonLink). */
export function PillLink({ href, children, variant = "primary", className, ...rest }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "white" | "ghost"; className?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 t-label font-semibold transition-colors duration-150 [&_svg]:size-5 [&_svg]:shrink-0",
        variant === "primary" && "bg-blue text-white hover:bg-blue-hover",
        variant === "secondary" && "border border-line bg-white text-navy hover:bg-sky",
        variant === "white" && "bg-white text-navy hover:bg-blue-tint",
        variant === "ghost" && "text-navy hover:bg-blue-tint",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  )
}

/** App Store and Google Play badges (prototype: both open the app). */
export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <Link href="/app" className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-black px-4 text-white hover:bg-black/85">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="currentColor">
          <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.86-.76a4.24 4.24 0 0 0-3.58 2.18c-1.53 2.65-.39 6.57 1.1 8.72.73 1.05 1.59 2.23 2.72 2.19 1.1-.05 1.51-.71 2.83-.71 1.32 0 1.69.71 2.85.69 1.18-.02 1.92-1.07 2.64-2.12a9.4 9.4 0 0 0 1.2-2.46 3.8 3.8 0 0 1-2.27-3.49zM14.2 6.13A3.85 3.85 0 0 0 15.1 3.4a3.94 3.94 0 0 0-2.56 1.32 3.67 3.67 0 0 0-.92 2.65 3.25 3.25 0 0 0 2.58-1.24z" />
        </svg>
        <span className="flex flex-col leading-none">
          <span className="text-[10px]">Download on the</span>
          <span className="text-[17px] font-semibold">App Store</span>
        </span>
        <span className="sr-only"> (opens the prototype app)</span>
      </Link>
      <Link href="/app" className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-black px-4 text-white hover:bg-black/85">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path fill="#34A853" d="M3.6 2.2 13.4 12l-9.8 9.8a1.6 1.6 0 0 1-.6-1.3V3.5c0-.5.2-1 .6-1.3z" />
          <path fill="#FBBC05" d="m16.7 15.3-3.3-3.3 3.3-3.3 3.7 2.1c1 .6 1 1.9 0 2.4z" />
          <path fill="#EA4335" d="M13.4 12 3.6 21.8c.4.3 1 .4 1.6.1l11.5-6.6z" />
          <path fill="#4285F4" d="M13.4 12 16.7 8.7 5.2 2.1c-.6-.3-1.2-.2-1.6.1z" />
        </svg>
        <span className="flex flex-col leading-none">
          <span className="text-[10px] uppercase">Get it on</span>
          <span className="text-[17px] font-semibold">Google Play</span>
        </span>
        <span className="sr-only"> (opens the prototype app)</span>
      </Link>
    </div>
  )
}

/** Clearly labelled page hero used by the marketing pages. */
export function PageHero({ eyebrow, title, sub, children, crumbs }: { eyebrow?: string; title: string; sub?: string; children?: React.ReactNode; crumbs?: React.ReactNode }) {
  return (
    <div className="border-b border-line bg-white">
      <Container className="py-10 md:py-14">
        {crumbs}
        {eyebrow && <p className="mt-3 t-label text-blue">{eyebrow}</p>}
        <h1 className="t-display mt-2 max-w-3xl">{title}</h1>
        {sub && <p className="mt-3 max-w-2xl t-body text-slate">{sub}</p>}
        {children}
      </Container>
    </div>
  )
}
