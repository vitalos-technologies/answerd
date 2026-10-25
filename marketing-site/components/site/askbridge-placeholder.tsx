"use client"
import * as React from "react"
import dynamic from "next/dynamic"
import { ChevronDown } from "lucide-react"
import { Mark } from "@/components/brand/Mark"
import type { site } from "@/content/site"
import type { Suggestion } from "@/lib/data/queries"

export type AskbridgeCopy = (typeof site)["askbridge"]
/** Placeholder matches per chip, from the mock data (built on the server in islands.tsx). */
export type Suggestions = Record<string, Suggestion[]>

/*
 * LOCAL PLACEHOLDER for the Askbridge chat widget (askbridge.vitalos.co.uk). It loads nothing third-party.
 * When the real embed is live, askbridge.tsx renders the embed script instead of this file.
 * The pill is plain markup; the panel (askbridge-panel.tsx) loads on first tap.
 */

const AskbridgePanel = dynamic(() => import("./askbridge-panel"), { ssr: false })
const PANEL_ID = "askbridge-panel"
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"

export function AskbridgePlaceholder({ copy, suggestions }: { copy: AskbridgeCopy; suggestions: Suggestions }) {
  const [open, setOpen] = React.useState(false)
  const [used, setUsed] = React.useState(false)
  const pillRef = React.useRef<HTMLButtonElement>(null)

  const close = React.useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) pillRef.current?.focus()
  }, [])

  return (
    <div
      className="fixed right-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 flex flex-col items-end transition-transform duration-300 ease-out [--offset:calc(var(--app-bar-h,0px)+var(--listing-bar-h,0px))] motion-reduce:transition-none max-md:[--offset:calc(var(--app-bar-h,0px)+var(--listing-bar-h,0px)+var(--cookie-banner-h,0px))] md:right-6 md:bottom-6"
      style={{ transform: "translateY(calc(-1 * var(--offset)))" }}
    >
      {used && <AskbridgePanel copy={copy} suggestions={suggestions} open={open} close={close} />}

      <button
        ref={pillRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? PANEL_ID : undefined}
        onClick={() => {
          setUsed(true)
          if (open) close(false)
          else setOpen(true)
        }}
        className={`inline-flex h-12 items-center gap-2.5 rounded-full bg-blue pr-5 pl-3 font-semibold text-white shadow-lift transition-[background-color,transform] duration-150 hover:bg-blue-hover active:scale-[0.98] motion-reduce:transition-none ${focusRing}`}
      >
        {open ? (
          <span className="inline-flex size-7 items-center justify-center" aria-hidden>
            <ChevronDown className="size-5" />
          </span>
        ) : (
          <Mark size={28} variant="white" />
        )}
        <span className="text-[15px] md:text-base">{copy.pill}</span>
      </button>
    </div>
  )
}
