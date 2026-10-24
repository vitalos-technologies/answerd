import type { Metadata } from "next"
import { PhoneFrame } from "@/components/shells/PhoneFrame"

export const metadata: Metadata = { title: "App", robots: { index: false } }

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <PhoneFrame>{children}</PhoneFrame>
}
