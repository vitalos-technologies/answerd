"use client"
import Script from "next/script"
import { useConsent } from "./consent"
import { AskbridgePlaceholder, type AskbridgeCopy, type Suggestions } from "./askbridge-placeholder"

const SITE_ID = process.env.NEXT_PUBLIC_ASKBRIDGE_SITE_ID

/**
 * Chat entry point. With a site id and full consent, the real Askbridge embed loads (lazily) and owns the
 * button. Otherwise, including before the visitor has chosen, only the local placeholder renders: nothing
 * third-party loads without consent.
 */
export function AskbridgeClient({ copy, suggestions }: { copy: AskbridgeCopy; suggestions: Suggestions }) {
  const consent = useConsent()
  if (SITE_ID) {
    if (consent === "all") return <Script src="https://askbridge.vitalos.co.uk/embed.js" strategy="lazyOnload" data-site-id={SITE_ID} />
    // Until consent is known, render nothing so the placeholder doesn't flash before the embed takes over.
    if (consent === undefined) return null
  }
  return <AskbridgePlaceholder copy={copy} suggestions={suggestions} />
}
