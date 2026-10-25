"use client"
import * as React from "react"
import Link from "next/link"
import { ChevronRight, Download, ExternalLink, Trash2 } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { ToggleRow } from "@/components/answerd/Fields"
import { siteUrl } from "@/lib/site"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"

/** C-43: marketing consent, download my data, delete account, privacy policy. */
export default function PrivacyPage() {
  const s = useStore()
  const user = s.users.find((u) => u.id === s.session.userId)
  return (
    <AppScreen id="C-43" header={<TopBar title="Privacy and data" back="/app/account" />}>
      <div className="space-y-4 p-4">
        <section className="card px-4">
          <ToggleRow
            label="Marketing from Answerd"
            description="Offers and news. Booking messages are always sent."
            checked={!!user?.marketingConsent}
            onChange={(v) => {
              s.updateProfile({ marketingConsent: v })
              s.updateCustomerPrefs({ offers: v })
              toast(v ? "Marketing turned on" : "Marketing turned off")
            }}
          />
        </section>
        <div className="card divide-y divide-line overflow-hidden">
          <button type="button" onClick={() => toast(`We'll email your data to ${user?.email ?? "your email"} within 30 days`)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-sky">
            <Download className="size-5 text-blue" aria-hidden />
            <span className="flex-1 t-label text-navy">Download my data</span>
          </button>
          <Link href="/app/account/delete" className="flex min-h-14 items-center gap-3 px-4 hover:bg-sky">
            <Trash2 className="size-5 text-red" aria-hidden />
            <span className="flex-1 t-label text-red">Delete account</span>
            <ChevronRight className="size-5 text-muted-ink" aria-hidden />
          </Link>
          <Link href={siteUrl("/privacy")} className="flex min-h-14 items-center gap-3 px-4 hover:bg-sky">
            <ExternalLink className="size-5 text-muted-ink" aria-hidden />
            <span className="flex-1 t-label text-navy">Privacy notice</span>
          </Link>
        </div>
        <p className="px-1 t-caption text-muted-ink">Answerd is run by Vitalos Technologies. We only share your name, phone and job details with businesses you contact.</p>
      </div>
    </AppScreen>
  )
}
