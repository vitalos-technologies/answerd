import Link from "next/link"
import { Mark } from "@/components/brand/Mark"
import { siteUrl } from "@/lib/site"

/** Prototype 404. The website's own 404 (W-24) lives on the website. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-sky px-6 py-16 text-center max-sm:px-4">
      <span className="inline-flex size-20 items-center justify-center rounded-full bg-blue-tint">
        <Mark size={44} />
      </span>
      <h1 className="t-title mt-5">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md t-body text-slate">This is the Answerd prototype. The app, business mode and admin start from the hub; the website has its own address.</p>
      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {[
          ["/hub", "Prototype hub"],
          ["/app/splash", "Open the app"],
          ["/admin", "Admin"],
          [siteUrl("/"), "Website"],
        ].map(([href, label]) => (
          <li key={href}>
            <Link href={href!} className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 t-label text-navy hover:border-blue">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
