"use client"
import * as React from "react"
import { GetAppProvider, type GetAppCopy } from "./get-app"

export function Providers({ qr, getApp, children }: { qr: React.ReactNode; getApp: GetAppCopy; children: React.ReactNode }) {
  // Marks the page as hydrated, so entrance transitions (e.g. the cookie banner reappearing) only run for
  // elements added after first paint.
  React.useEffect(() => {
    document.documentElement.dataset.hydrated = ""
  }, [])
  return (
    <GetAppProvider qr={qr} copy={getApp}>
      {children}
    </GetAppProvider>
  )
}
