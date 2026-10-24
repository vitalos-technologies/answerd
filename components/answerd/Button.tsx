"use client"
import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full t-label font-semibold whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-blue text-white hover:bg-blue-hover",
        secondary: "bg-white text-navy border border-line hover:bg-sky",
        ghost: "text-navy hover:bg-blue-tint",
        destructive: "bg-red text-white hover:bg-[#B91C1C]",
        tint: "bg-blue-tint text-blue hover:bg-[#dbe5ff]",
        link: "text-blue underline-offset-4 hover:underline rounded-md px-0",
      },
      size: {
        lg: "h-12 px-6 text-[15px] [&_svg]:size-5",
        md: "h-11 px-5 [&_svg]:size-[18px]",
        sm: "h-9 px-4 text-[13px] [&_svg]:size-4",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "lg", block: false },
  },
)

type Common = VariantProps<typeof buttonStyles> & { loading?: boolean; className?: string; children?: React.ReactNode }

export function Button({
  variant,
  size,
  block,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(buttonStyles({ variant, size, block }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          <span className="sr-only">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function ButtonLink({
  href,
  variant,
  size,
  block,
  className,
  children,
  ...props
}: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cn(buttonStyles({ variant, size, block }), className)} {...props}>
      {children}
    </Link>
  )
}

/** 44 × 44 icon button with a required label. */
export function IconButton({
  label,
  className,
  children,
  tone = "plain",
  ...props
}: { label: string; tone?: "plain" | "white" | "tint" | "navy" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 disabled:opacity-40 [&_svg]:size-5",
        tone === "plain" && "text-navy hover:bg-blue-tint",
        tone === "white" && "bg-white/95 text-navy shadow-card hover:bg-white",
        tone === "tint" && "bg-blue-tint text-blue hover:bg-[#dbe5ff]",
        tone === "navy" && "text-white hover:bg-white/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function IconLink({ href, label, className, children, tone = "plain" }: { href: string; label: string; className?: string; children: React.ReactNode; tone?: "plain" | "white" | "tint" | "navy" }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 [&_svg]:size-5",
        tone === "plain" && "text-navy hover:bg-blue-tint",
        tone === "white" && "bg-white/95 text-navy shadow-card hover:bg-white",
        tone === "tint" && "bg-blue-tint text-blue hover:bg-[#dbe5ff]",
        tone === "navy" && "text-white hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  )
}
