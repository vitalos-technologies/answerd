import { AppIcon } from "@/components/brand/Mark"
import { GetAppButton } from "./get-app"
import { SmartBannerClose } from "./smart-banner-close"
import { pages } from "@/content/pages"

/**
 * W-26 smart app banner, phones only (below 768 px). Server-rendered at the top of the page so it never
 * shifts layout; once closed it stays hidden for the session (an inline script in the layout hides it
 * before paint). "Get" is the same Get the app action as everywhere else: the right store on a phone.
 */
export function SmartBanner() {
  const c = pages.smartBanner
  return (
    <aside aria-label={c.label} data-smart-banner="" className="flex items-center gap-3 border-b border-line bg-white py-2 pr-4 pl-2 md:hidden">
      <SmartBannerClose label={c.close} />
      <AppIcon size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-5 font-semibold text-navy">{c.title}</p>
        <p className="truncate text-[13px] leading-5 text-muted-ink">{c.body}</p>
      </div>
      <GetAppButton size="sm" label={c.cta} className="px-5" />
    </aside>
  )
}
