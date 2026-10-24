import { Suspense } from "react"
import { Header } from "@/components/site/header"
import { Hero } from "@/components/site/hero"
import { TrustStrip } from "@/components/site/trust-strip"
import { HowItWorks } from "@/components/site/how-it-works"
import { PopularServices } from "@/components/site/popular-services"
import { WhyAnswerd } from "@/components/site/why-answerd"
import { DownloadBand } from "@/components/site/download-band"
import { ForBusinesses } from "@/components/site/for-businesses"
import { Faqs } from "@/components/site/faqs"
import { Footer } from "@/components/site/footer"
import { Askbridge, CookieBanner, MobileAppBar } from "@/components/site/islands"
import { JsonLd } from "@/components/site/json-ld"

export default function Home() {
  return (
    <>
      <JsonLd />
      <Header />
      <main id="main" className="flex-1">
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
