"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { ListSkeleton, ErrorState } from "@/components/answerd/Feedback"

export function signInHref(next: string) {
  return `/app/sign-in?next=${encodeURIComponent(next)}`
}

/** Returns a navigate function that detours guests through C-05 with next set. */
export function useAuthNav() {
  const router = useRouter()
  const userId = useStore((s) => s.session.userId)
  return React.useCallback(
    (href: string) => {
      router.push(userId ? href : signInHref(href))
    },
    [router, userId],
  )
}

/** A link that sends guests to sign in first. */
export function AuthLink({ href, children, className, ...rest }: { href: string; children: React.ReactNode; className?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const userId = useStore((s) => s.session.userId)
  return (
    <Link href={userId ? href : signInHref(href)} className={className} {...rest}>
      {children}
    </Link>
  )
}

export function safeNext(next: string | null | undefined, fallback = "/app") {
  if (!next || !next.startsWith("/")) return fallback
  return next
}

/** Hub "Preview states" override for list and data screens. */
export function useDataState() {
  return useStore((s) => s.stateOverride)
}

export function DataGate({ empty, isEmpty, children, rows = 4 }: { empty: React.ReactNode; isEmpty: boolean; children: React.ReactNode; rows?: number }) {
  const override = useDataState()
  if (override === "loading") return <ListSkeleton rows={rows} />
  if (override === "error") return <ErrorState onRetry={() => useStore.getState().setStateOverride("none")} />
  if (override === "empty" || isEmpty) return <>{empty}</>
  return <>{children}</>
}

export function withSuspense<P extends object>(C: React.ComponentType<P>) {
  return function Suspended(props: P) {
    return (
      <React.Suspense fallback={null}>
        <C {...props} />
      </React.Suspense>
    )
  }
}

/** Waits for the persisted store before rendering (avoids redirect flapping). */
export function useHydrated() {
  return useStore((s) => s.hydrated)
}
