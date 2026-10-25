import { Header } from "@/components/site/header"
import { Footer } from "@/components/site/footer"
import { SmartBanner } from "@/components/site/smart-banner"
import { Askbridge, CookieBanner } from "@/components/site/islands"
import { cn } from "@/lib/utils"
import { WebSprite } from "./sprite"

/**
 * Frame for every page except the home page: smart app banner (phones), header with Get the app, main,
 * footer, the Askbridge chat placeholder and the cookie banner.
 */
export function WebPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      <WebSprite />
      <SmartBanner />
      <Header />
      <main id="main" className={cn("flex-1", className)}>
        {children}
      </main>
      <Footer />
      <Askbridge />
      <CookieBanner />
    </>
  )
}
