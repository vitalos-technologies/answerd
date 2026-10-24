import type { Metadata } from "next"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Account } from "@/components/web/account/Account"

export const metadata: Metadata = { title: "Your account", robots: { index: false } }

/** Customer account page that W-12 sends customers to. */
export default function Page() {
  return (
    <>
      <ScreenMeta id="W-12" />
      <Account />
    </>
  )
}
