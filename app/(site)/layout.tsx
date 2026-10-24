import { WebHeader, WebFooter } from "@/components/shells/Web"
import { SiteChrome, SmartBanner } from "@/components/web/chrome"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-sky">
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
