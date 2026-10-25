import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/site/providers"
import { QrCode } from "@/components/site/qr-code"
import { MarkSprite } from "@/components/brand/Mark"
import { StatusBarSprite } from "@/components/site/phone/device"
import { APP_STORE_URL, PLAY_STORE_URL, SITE_URL, site } from "@/content/site"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: site.metaTitle,
  description: site.description,
  applicationName: site.name,
  keywords: [...site.seo.keywords],
  authors: [{ name: "Vitalos Technologies", url: "https://vitalos.co.uk" }],
  publisher: "Vitalos Technologies",
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.metaTitle,
    description: site.description,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: site.metaTitle,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
}

export const viewport: Viewport = { themeColor: "#FFFFFF" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Hide the cookie banner before paint for visitors who already chose (no flash, no layout shift) */}
        <script dangerouslySetInnerHTML={{ __html: `try{var c=localStorage.getItem("answerd-consent");if(c)document.documentElement.dataset.consent=c}catch(e){}` }} />
        {/* Same for the smart app banner once closed this session (components/site/smart-banner.tsx) */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem("answerd-sb-off"))document.documentElement.dataset.sbOff=""}catch(e){}` }} />
        {/* Without JS, scroll reveals and the Ask Answerd sequence show in their final state */}
        <noscript>
          <style>{`[data-reveal],[data-stagger-item],.ask-reply,.ask-chip{opacity:1!important;transform:none!important}.ask-typing{display:none}`}</style>
        </noscript>
      </head>
      <body>
        {/* Shared SVG symbols (the mark, phone status bar glyphs) referenced by <use> across the page */}
        <MarkSprite />
        <StatusBarSprite />
        {/* Base UI: a root stacking context so portalled popups sit above page content */}
        <div className="root isolate flex min-h-dvh flex-col">
          <Providers
            qr={<QrCode size={200} />}
            getApp={{ label: site.getApp, dialogTitle: site.download.headline, dialogBody: site.download.dialogBody, appStoreUrl: APP_STORE_URL, playStoreUrl: PLAY_STORE_URL }}
          >
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
}
