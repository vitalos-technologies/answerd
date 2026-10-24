"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Bell } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { OsAlert } from "@/components/app/OsDialogs"
import { useStore } from "@/lib/store"
import { safeNext, withSuspense } from "@/components/app/helpers"

/** C-04: asked after the first message or booking, never at launch. */
function NotificationsPermission() {
  const router = useRouter()
  const next = safeNext(useSearchParams().get("next"))
  const setAsked = useStore((s) => s.setNotificationsAsked)
  const [prompt, setPrompt] = React.useState(false)
  const done = (enabled: boolean) => {
    setAsked(enabled)
    router.replace(next)
  }
  return (
    <AppScreen id="C-04" bg="white">
      <div className="flex h-full flex-col px-6 pb-6">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative mb-8 flex size-44 items-center justify-center rounded-full bg-blue-tint">
            <Bell className="size-16 text-blue" strokeWidth={1.5} aria-hidden />
            <span className="absolute right-8 top-9 inline-flex size-6 items-center justify-center rounded-full bg-red text-[12px] font-semibold text-white">1</span>
          </div>
          <h1 className="t-display">Know when a business replies</h1>
          <p className="mt-3 t-body text-slate">We&apos;ll tell you when they reply, confirm a booking or are on their way. No marketing.</p>
        </div>
        <div className="space-y-2">
          <Button block onClick={() => setPrompt(true)}>
            Turn on
          </Button>
          <Button block variant="ghost" onClick={() => done(false)}>
            Not now
          </Button>
        </div>
      </div>
      <OsAlert
        open={prompt}
        title="“Answerd” would like to send you notifications"
        body="Notifications may include alerts, sounds and icon badges."
        actions={[
          { label: "Don't Allow", onClick: () => (setPrompt(false), done(false)) },
          { label: "Allow", bold: true, onClick: () => (setPrompt(false), done(true)) },
        ]}
      />
    </AppScreen>
  )
}

export default withSuspense(NotificationsPermission)
