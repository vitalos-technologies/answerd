"use client"
import * as React from "react"
import Link from "next/link"
import { MapPin, Search as SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Icon } from "./Icon"

/** White pill 52 high, placeholder "What service do you need?", location chip on the right. */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  locationLabel,
  onLocationClick,
  locationHref,
  href,
  autoFocus,
  className,
  submitButton,
  inputRef,
}: {
  value?: string
  onChange?: (v: string) => void
  onSubmit?: (v: string) => void
  locationLabel?: string
  onLocationClick?: () => void
  locationHref?: string
  href?: string
  autoFocus?: boolean
  className?: string
  submitButton?: boolean
  inputRef?: React.Ref<HTMLInputElement>
}) {
  const chip = locationLabel ? (
    locationHref ? (
      <Link href={locationHref} className="mr-1.5 inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-sky px-3 t-caption text-navy hover:bg-blue-tint" aria-label={`Change location, ${locationLabel}`}>
        <MapPin className="size-3.5 text-blue" aria-hidden />
        <span className="tnum">{locationLabel}</span>
      </Link>
    ) : (
      <button type="button" onClick={onLocationClick} className="mr-1.5 inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-sky px-3 t-caption text-navy hover:bg-blue-tint" aria-label={`Change location, ${locationLabel}`}>
        <MapPin className="size-3.5 text-blue" aria-hidden />
        <span className="tnum">{locationLabel}</span>
      </button>
    )
  ) : null

  const shell = "flex h-[52px] w-full items-center rounded-full border border-line bg-white shadow-card"
  if (href) {
    return (
      <div className={cn(shell, className)}>
        <Link href={href} className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-full pl-4 text-muted-ink">
          <SearchIcon className="size-5 shrink-0 text-navy" aria-hidden />
          <span className="truncate t-body">What service do you need?</span>
        </Link>
        {chip}
      </div>
    )
  }
  return (
    <form
      role="search"
      className={cn(shell, className)}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(value ?? "")
      }}
    >
      <label className="flex h-full min-w-0 flex-1 items-center gap-2.5 pl-4">
        <SearchIcon className="size-5 shrink-0 text-navy" aria-hidden />
        <span className="sr-only">What service do you need?</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          autoFocus={autoFocus}
          placeholder="What service do you need?"
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 bg-transparent t-body text-navy outline-none placeholder:text-muted-ink"
        />
      </label>
      {chip}
      {submitButton && (
        <button type="submit" aria-label="Search" className="mr-1.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue text-white hover:bg-blue-hover">
          <SearchIcon className="size-5" />
        </button>
      )}
    </form>
  )
}

/** 72 square white card, Lucide icon in a blue-tint circle, label under it. */
export function CategoryTile({ icon, label, href, className }: { icon: string; label: string; href: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-1.5 text-center", className)}>
      <span className="card flex size-[72px] items-center justify-center rounded-2xl transition-transform duration-150 hover:-translate-y-0.5">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-blue-tint text-blue">
          <Icon name={icon} size={22} />
        </span>
      </span>
      <span className="t-caption text-navy leading-tight">{label}</span>
    </Link>
  )
}
