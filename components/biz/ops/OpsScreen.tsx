"use client"
import * as React from "react"
import { Lock } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { signInHref } from "@/components/app/helpers"
import { useOps, type OpsCtx } from "./useOps"
import type { Business, Listing } from "@/lib/types"

export type ReadyCtx = OpsCtx & { biz: Business; listing: Listing }

/**
 * App wrapper for B-18 to B-29: navy business header, optional top bar and tab bar,
 * and the guest / no business / staff-not-allowed states. Only the app pages use this;
 * the reusable panels in this folder never depend on it.
 */
export function OpsScreen({
  id,
  title,
  back,
  tabs,
  header,
  footer,
  ownerOnly,
  bodyClassName,
  bg,
  children,
}: {
  id: string
  title?: string
  back?: string | true
  tabs?: boolean
  header?: React.ReactNode
  footer?: (ctx: ReadyCtx) => React.ReactNode
  ownerOnly?: boolean
  bodyClassName?: string
  bg?: "sky" | "white"
  children: (ctx: ReadyCtx) => React.ReactNode
}) {
  const ctx = useOps()
  const top = header ?? (title ? <TopBar title={title} back={back} /> : null)
  if (!ctx.s.session.userId) {
    return (
      <AppScreen id={id} header={top}>
        <EmptyState title="Sign in to run your business" body="Your inbox, diary and jobs live here." action={<ButtonLink href={signInHref(`/app/biz`)} size="md">Sign in</ButtonLink>} />
      </AppScreen>
    )
  }
  if (!ctx.biz || !ctx.listing || !ctx.role) {
    return (
      <AppScreen id={id} header={top}>
        <EmptyState title="No business yet" body="Claim or add your business to get calls, messages and bookings from Answerd." action={<ButtonLink href="/app/biz/claim" size="md">Find your business</ButtonLink>} />
      </AppScreen>
    )
  }
  const ready = ctx as ReadyCtx
  if (ownerOnly && ctx.staff) {
    return (
      <AppScreen id={id} biz header={top} tabs={tabs ? "business" : undefined}>
        <div className="px-4 pt-4">
          <div className="card flex flex-col items-center p-6 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-sky text-navy">
              <Lock className="size-5" aria-hidden />
            </span>
            <p className="mt-3 t-subhead">Only the owner can see this</p>
            <p className="mt-1 t-body text-slate">Staff see Today, the shared inbox and their own jobs in the diary.</p>
            <ButtonLink href="/app/biz" size="md" variant="secondary" className="mt-4">
              Back to Today
            </ButtonLink>
          </div>
        </div>
      </AppScreen>
    )
  }
  return (
    <AppScreen id={id} biz header={top} tabs={tabs ? "business" : undefined} footer={footer?.(ready)} bodyClassName={bodyClassName} bg={bg}>
      {children(ready)}
    </AppScreen>
  )
}
