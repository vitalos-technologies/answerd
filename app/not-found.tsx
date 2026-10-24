import Link from "next/link"
import { WebHeader, WebFooter } from "@/components/shells/Web"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Mark } from "@/components/brand/Mark"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-sky">
      <ScreenMeta id="W-24" />
      <WebHeader />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-6 py-20 text-center">
        <span className="inline-flex size-20 items-center justify-center rounded-full bg-blue-tint">
          <Mark size={44} />
        </span>
        <h1 className="t-title mt-5">We couldn&apos;t find that page</h1>
        <p className="mt-2 max-w-md t-body text-slate">The link may be old or mistyped. Search for a service instead.</p>
        <Link href="/search" className="mt-6 inline-flex h-12 items-center rounded-full bg-blue px-6 t-label font-semibold text-white hover:bg-blue-hover">
          Find a business
        </Link>
      </main>
      <WebFooter />
    </div>
  )
}
