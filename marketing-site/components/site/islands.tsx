import { site } from "@/content/site"
import { askSuggestions } from "@/lib/data/queries"
import { CookieBannerClient, CookieSettingsClient } from "./cookie-banner"
import { MobileAppBarClient } from "./mobile-app-bar"
import { AskbridgeClient } from "./askbridge"

/*
 * Server wrappers that hand each client island just the copy it needs from content/site.ts, so the full
 * content module never ships to the browser.
 */

export function CookieBanner() {
  return <CookieBannerClient copy={site.cookies} />
}

export function CookieSettingsButton() {
  return <CookieSettingsClient copy={site.cookies} />
}

export function MobileAppBar() {
  return <MobileAppBarClient label={site.mobileBar} />
}

export function Askbridge() {
  return <AskbridgeClient copy={site.askbridge} suggestions={askSuggestions(site.askbridge.chips)} />
}
