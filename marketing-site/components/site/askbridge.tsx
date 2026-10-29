"use client"
import Script from "next/script"
import { allows, useConsent } from "./consent"
import { AskbridgePlaceholder, type AskbridgeCopy, type Suggestions } from "./askbridge-placeholder"

/** The Answerd workspace's public site key in Askbridge (pk_…), set at build time from the repo variable ASKBRIDGE_SITE_KEY. */
const SITE_KEY = process.env.NEXT_PUBLIC_ASKBRIDGE_SITE_KEY
const WIDGET_SRC = "https://askbridge.vitalos.co.uk/widget/v1/askbridge.js"

/**
 * Chat entry point. With a site key and consent to the chat, the real Askbridge widget loads (lazily) and owns the
 * button. Otherwise, including before the visitor has chosen, only the local placeholder renders: nothing
 * third-party loads without consent.
 */
export function AskbridgeClient({ copy, suggestions }: { copy: AskbridgeCopy; suggestions: Suggestions }) {
  const consent = useConsent()
  if (SITE_KEY) {
    // The loader finds its tag by `script[data-site][src*="askbridge"]`, so data-site must stay on the element.
    if (allows(consent, "chat")) return <Script id="askbridge-widget" src={WIDGET_SRC} strategy="lazyOnload" data-site={SITE_KEY} />
    // Until consent is known, render nothing so the placeholder doesn't flash before the widget takes over.
    if (consent === undefined) return null
  }
  return <AskbridgePlaceholder copy={copy} suggestions={suggestions} />
}
