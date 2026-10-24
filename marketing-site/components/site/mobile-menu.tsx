"use client"
import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { GetAppButton } from "./get-app"
import { focusRing } from "./focus"

/** Phone navigation sheet. Loaded on first tap of the header's menu button. */
export default function MobileMenuSheet({ nav, open, onOpenChange, returnFocus }: { nav: readonly { label: string; href: string }[]; open: boolean; onOpenChange: (open: boolean) => void; returnFocus: React.RefObject<HTMLButtonElement | null> }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} finalFocus={returnFocus} className="w-[min(100%,360px)] gap-0 bg-white p-0 motion-reduce:transition-none">
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <Logo size={30} />
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetClose aria-label="Close menu" className={`-mr-2 inline-flex size-12 items-center justify-center rounded-full text-navy hover:bg-sky ${focusRing}`}>
            <X className="size-6" aria-hidden />
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>
        <nav aria-label="Main" className="px-3 py-4">
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => onOpenChange(false)} className={`flex h-14 items-center rounded-xl px-3 text-xl font-semibold text-navy hover:bg-sky ${focusRing}`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Close the sheet as the Get the app dialog opens so the two never stack. */}
        <div className="mt-auto border-t border-line p-6 pb-[max(24px,env(safe-area-inset-bottom))]" onClickCapture={() => onOpenChange(false)}>
          <GetAppButton icon className="w-full" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
