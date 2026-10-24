import type { Metadata } from "next"
import { DashboardFrame } from "@/components/dashboard/DashboardFrame"

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardFrame>{children}</DashboardFrame>
}
