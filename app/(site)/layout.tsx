import { WebHeader, WebFooter } from "@/components/shells/Web"
import { SiteChrome, SmartBanner } from "@/components/web/chrome"
import { MaintenanceBanner } from "@/components/admin/super/live"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-sky">
      <MaintenanceBanner />
      <SmartBanner />
      <WebHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <WebFooter />
      <SiteChrome />
    </div>
  )
}
