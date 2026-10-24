import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers, HubButton, GlobalChrome } from "@/components/shells/Providers"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://answerd.vitalos.co.uk"),
  title: { default: "Answerd: local services", template: "%s | Answerd" },
  description: "Find, call, message and book local businesses. Every business picks up.",
  applicationName: "Answerd",
}

export const viewport: Viewport = {
  themeColor: "#0F2D5B",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <GlobalChrome />
          <HubButton />
        </Providers>
      </body>
    </html>
  )
}
