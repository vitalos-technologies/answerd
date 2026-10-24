import type { Metadata } from "next"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { SearchPage } from "@/components/web/SearchPage"

export const metadata: Metadata = {
  title: "Find a local business",
  description: "Search local plumbers, cleaners, mechanics, barbers and more. See prices, reviews and who responds instantly, then call, message or book.",
  alternates: { canonical: "/search" },
}

/** W-02: Search results. */
export default function Page() {
  return (
    <>
      <ScreenMeta id="W-02" />
      <SearchPage />
    </>
  )
}
