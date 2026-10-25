import type { Metadata } from "next"
import { PhoneFrame } from "@/components/shells/PhoneFrame"
import { MaintenanceGate } from "@/components/admin/super/live"

export const metadata: Metadata = { title: "App", robots: { index: false } }

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PhoneFrame>
      <MaintenanceGate>{children}</MaintenanceGate>
    </PhoneFrame>
  )
}
