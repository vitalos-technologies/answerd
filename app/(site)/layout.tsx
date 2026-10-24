import { WebHeader, WebFooter } from "@/components/shells/Web"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-sky">
      <WebHeader />
      <main className="flex-1">{children}</main>
      <WebFooter />
    </div>
  )
}
