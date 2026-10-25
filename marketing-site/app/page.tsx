import { Suspense } from "react"
import { Header } from "@/components/site/header"
import { Hero } from "@/components/site/hero"
import { TrustStrip } from "@/components/site/trust-strip"
import { HowItWorks } from "@/components/site/how-it-works"
import { PopularServices } from "@/components/site/popular-services"
import { InstantResponders } from "@/components/site/instant-responders"
import { WhyAnswerd } from "@/components/site/why-answerd"
import { DownloadBand } from "@/components/site/download-band"
import { ForBusinesses } from "@/components/site/for-businesses"
import { Faqs } from "@/components/site/faqs"
import { Footer } from "@/components/site/footer"
import { SmartBanner } from "@/components/site/smart-banner"
import { Askbridge, CookieBanner, MobileAppBar } from "@/components/site/islands"
import { JsonLd } from "@/components/site/json-ld"
import { WebSprite } from "@/components/web/sprite"
import { pageMeta } from "@/lib/seo"
import { site } from "@/content/site"

export const metadata = pageMeta({ title: site.metaTitle, description: site.description, path: "" })

export default function Home() {
  return (
    <>
      <JsonLd />
      <WebSprite />
      <SmartBanner />
      <Header />
      <main id="main" data-home="" className="flex-1">
        <Hero />
        {/* Each below-the-fold section is its own Suspense boundary, so React hydrates them in separate short
            tasks (selective hydration) instead of one long one. Nothing here suspends, so the HTML is unchanged. */}
        <Suspense>
          <TrustStrip />
        </Suspense>
        <Suspense>
          <HowItWorks />
        </Suspense>
        <Suspense>
          <PopularServices />
        </Suspense>
        <Suspense>
          <InstantResponders />
        </Suspense>
        <Suspense>
          <WhyAnswerd />
        </Suspense>
        <Suspense>
          <DownloadBand />
        </Suspense>
        <Suspense>
          <ForBusinesses />
        </Suspense>
        <Suspense>
          <Faqs />
        </Suspense>
      </main>
      <Suspense>
        <Footer />
      </Suspense>
      <MobileAppBar />
      <Askbridge />
      <CookieBanner />
    </>
  )
}
