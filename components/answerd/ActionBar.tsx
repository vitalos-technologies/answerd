"use client"
import Link from "next/link"
import { CalendarPlus, MessageCircle, Phone, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonStyles } from "./Button"

/** Sticky bottom bar on listings: Call, Message, Book; unclaimed: Call and Claim this business. */
export function ActionBar({
  variant = "claimed",
  callHref,
  messageHref,
  bookHref,
  claimHref,
  showBook = true,
  businessName,
  className,
}: {
  variant?: "claimed" | "unclaimed"
  callHref: string
  messageHref?: string
  bookHref?: string
  claimHref?: string
  showBook?: boolean
  businessName: string
  className?: string
}) {
  return (
    <div className={cn("flex gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur", className)}>
      <Link href={callHref} className={cn(buttonStyles({ variant: "secondary", size: "lg" }), "flex-1 px-3")} aria-label={`Call ${businessName}`}>
        <Phone /> Call
      </Link>
      {variant === "claimed" ? (
        <>
          {messageHref && (
            <Link href={messageHref} className={cn(buttonStyles({ variant: showBook ? "secondary" : "primary", size: "lg" }), "flex-1 px-3")} aria-label={`Message ${businessName}`}>
              <MessageCircle /> Message
            </Link>
          )}
          {showBook && bookHref && (
            <Link href={bookHref} className={cn(buttonStyles({ variant: "primary", size: "lg" }), "flex-1 px-3")} aria-label={`Book ${businessName}`}>
              <CalendarPlus /> Book
            </Link>
          )}
        </>
      ) : (
        claimHref && (
          <Link href={claimHref} className={cn(buttonStyles({ variant: "primary", size: "lg" }), "flex-[1.6] px-3")}>
            <Store /> Claim this business
          </Link>
        )
      )}
    </div>
  )
}
