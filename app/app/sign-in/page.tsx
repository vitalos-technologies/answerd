"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Apple, Smartphone } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { RouteSheet } from "@/components/app/RouteSheet"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Mark } from "@/components/brand/Mark"
import { OsAuthSheet, OsRow } from "@/components/app/OsDialogs"
import { safeNext, withSuspense } from "@/components/app/helpers"
import { siteUrl } from "@/lib/site"
import { useStore } from "@/lib/store"

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

/** C-05: sign in only when needed; always returns the person to what they tapped. */
function SignInSheet() {
  const router = useRouter()
  const next = safeNext(useSearchParams().get("next"))
  const signIn = useStore((s) => s.signIn)
  const [os, setOs] = React.useState<null | "apple" | "google">(null)
  const [failed, setFailed] = React.useState<null | "apple" | "google">(null)
  const q = `?next=${encodeURIComponent(next)}`

  const close = () => {
    if (window.history.length > 1) router.back()
    else router.replace("/app")
  }
  const existing = (persona: "tayo" | "sam", method: "apple" | "google") => {
    signIn(persona, method)
    setOs(null)
    router.replace(next)
  }
  const fresh = (method: "apple" | "google", first: string, last: string) => {
    setOs(null)
    router.push(`/app/sign-in/about-you${q}&method=${method}&first=${encodeURIComponent(first)}&last=${encodeURIComponent(last)}`)
  }

  return (
    <AppScreen id="C-05">
      <RouteSheet
        title="Sign in"
        hideTitle
        onClose={close}
        backdrop={
          <div className="flex h-full items-center justify-center bg-sky">
            <Mark size={120} className="opacity-20" />
          </div>
        }
      >
        <div className="flex flex-col items-center pb-2 text-center">
          <Mark size={56} />
          <h1 className="t-title mt-3">Sign in to message and book</h1>
          <p className="mt-1 t-body text-slate">It takes a few seconds. We&apos;ll bring you straight back.</p>
        </div>
        {failed && (
          <Banner tone="error" className="mt-3" title={`Sign in with ${failed === "apple" ? "Apple" : "Google"} didn't finish`} onDismiss={() => setFailed(null)}>
            Try again, or continue with your phone number.
          </Banner>
        )}
        <div className="mt-4 space-y-2">
          <Button block onClick={() => router.push(`/app/sign-in/phone${q}`)}>
            <Smartphone /> Continue with phone
          </Button>
          <Button block variant="secondary" className="bg-black text-white hover:bg-black/85 border-black" onClick={() => setOs("apple")}>
            <Apple /> Continue with Apple
          </Button>
          <Button block variant="secondary" onClick={() => setOs("google")}>
            <GoogleG /> Continue with Google
          </Button>
          <Button block variant="ghost" onClick={close}>
            Continue as guest
          </Button>
        </div>
        <p className="mt-3 text-center t-caption text-muted-ink">
          By continuing you agree to our{" "}
          <Link href={siteUrl("/terms")} className="text-blue underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href={siteUrl("/privacy")} className="text-blue underline">
            privacy notice
          </Link>
          .
        </p>
      </RouteSheet>

      <OsAuthSheet
        open={os === "apple"}
        provider="apple"
        onCancel={() => {
          setOs(null)
          setFailed("apple")
        }}
      >
        <OsRow title="Tayo Adeyemi" subtitle="tayo@example.com · used with Answerd before" onClick={() => existing("tayo", "apple")} />
        <OsRow title="Continue as Alex Morgan" subtitle="Hide my email: relay address shared" onClick={() => fresh("apple", "Alex", "Morgan")} />
      </OsAuthSheet>
      <OsAuthSheet
        open={os === "google"}
        provider="google"
        onCancel={() => {
          setOs(null)
          setFailed("google")
        }}
      >
        <OsRow title="Tayo Adeyemi" subtitle="tayo@example.com" onClick={() => existing("tayo", "google")} />
        <OsRow title="Sam Okafor" subtitle="sam@swiftplumbing.example" onClick={() => existing("sam", "google")} />
        <OsRow title="Use another account" onClick={() => fresh("google", "", "")} />
      </OsAuthSheet>
    </AppScreen>
  )
}

export default withSuspense(SignInSheet)
