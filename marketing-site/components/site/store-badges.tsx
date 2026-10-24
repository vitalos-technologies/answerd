import { cn } from "@/lib/utils"
import { APP_STORE_URL, PLAY_STORE_URL } from "@/content/site"

/*
 * PLACEHOLDER store badges. Swap for the official Apple "Download on the App Store" and
 * Google "Get it on Google Play" badge artwork before launch (the brand guidelines forbid redrawing them).
 */

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden fill="currentColor">
      <path d="M16.37 12.62c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.65.8-3.33.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.87.69 1.19-.02 1.94-1.08 2.66-2.15.84-1.23 1.19-2.43 1.21-2.49-.03-.01-2.31-.89-2.32-3.53zM14.18 6.15c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.96-.49 2.56-1.23z" />
    </svg>
  )
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
      <path fill="#34A853" d="M3.6 2.3 13.5 12l-9.9 9.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1z" />
      <path fill="#FBBC04" d="m17 15.5-3.5-3.5L17 8.5l4 2.3c1 .6 1 1.9 0 2.4z" />
      <path fill="#EA4335" d="M13.5 12 17 15.5 5.2 22.2c-.6.3-1.2.3-1.6-.5z" />
      <path fill="#4285F4" d="M3.6 2.3c.4-.8 1-.8 1.6-.5L17 8.5 13.5 12z" />
    </svg>
  )
}

function Badge({ href, store, className, size }: { href: string; store: "apple" | "google"; className?: string; size: "md" | "sm" }) {
  const apple = store === "apple"
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl bg-black text-white ring-1 ring-white/25 transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
        size === "md" ? "h-14 px-4" : "h-10 px-3",
        className,
      )}
      aria-label={apple ? "Download Answerd on the App Store" : "Get Answerd on Google Play"}
      data-placeholder-badge={store}
    >
      {apple ? <AppleGlyph /> : <PlayGlyph />}
      <span className="flex flex-col leading-none">
        <span className={cn("font-medium", size === "md" ? "text-[11px]" : "text-[9px]")}>{apple ? "Download on the" : "Get it on"}</span>
        <span className={cn("font-semibold tracking-tight", size === "md" ? "text-[19px] mt-0.5" : "text-[14px]")}>{apple ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  )
}

/** Both store badges. On mobile pass `block` for full-width badges. */
export function StoreBadges({ className, size = "md", block = false }: { className?: string; size?: "md" | "sm"; block?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-3", block && "flex-col sm:flex-row", className)}>
      <Badge store="apple" href={APP_STORE_URL} size={size} className={cn(block && "w-full justify-center sm:w-auto")} />
      <Badge store="google" href={PLAY_STORE_URL} size={size} className={cn(block && "w-full justify-center sm:w-auto")} />
    </div>
  )
}
