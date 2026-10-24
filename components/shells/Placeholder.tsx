"use client"
import Link from "next/link"
import { Hammer } from "lucide-react"
import { screenById } from "@/lib/screens"
import { ScreenMeta } from "./ScreenMeta"
import { AppScreen, TopBar } from "./AppScreen"
import { buttonStyles } from "@/components/answerd/Button"

function Body({ id }: { id: string }) {
  const s = screenById(id)
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-blue-tint text-blue">
        <Hammer className="size-7" aria-hidden />
      </span>
      <p className="mt-4 font-mono text-sm font-semibold text-blue">{id}</p>
      <h1 className="t-title mt-1">{s?.title ?? "Screen"}</h1>
      <p className="mt-2 t-body text-slate">Built in a later prompt.</p>
      <Link href="/hub" className={buttonStyles({ variant: "secondary", size: "md", className: "mt-6" })}>
        Back to the hub
      </Link>
    </div>
  )
}

/** Stand-in for routes not built yet, so nothing ever 404s. */
export function Placeholder({ id, surface = "web" }: { id: string; surface?: "app" | "web" | "dashboard" | "admin" }) {
  if (surface === "app") {
    return (
      <AppScreen id={id} header={<TopBar title={screenById(id)?.title} back="/hub" />}>
        <Body id={id} />
      </AppScreen>
    )
  }
  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <ScreenMeta id={id} />
      <Body id={id} />
    </div>
  )
}
