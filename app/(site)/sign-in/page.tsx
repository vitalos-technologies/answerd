import type { Metadata } from "next"
import { SignIn } from "@/components/web/auth/SignIn"

export const metadata: Metadata = { title: "Sign in", alternates: { canonical: "/sign-in" }, robots: { index: false } }

/** W-12: Sign in. */
export default function Page() {
  return <SignIn />
}
