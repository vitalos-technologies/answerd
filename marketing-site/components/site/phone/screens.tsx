import {
  CalendarCheck,
  ChevronLeft,
  Heart,
  House,
  MapPin,
  MessageCircle,
  Phone as PhoneIcon,
  Plus,
  Search,
  SendHorizontal,
  Share,
  SlidersHorizontal,
  UserRound,
  X,
  Zap,
} from "lucide-react"
import { Mark } from "@/components/brand/Mark"
import { cn } from "@/lib/utils"
import { site } from "@/content/site"
import { Avatar, CredBadge, DeskAvatar, InstantBadge, PulseDot, Stars } from "./parts"

/* Phone screens: real HTML at 320 x 694 logical px. Rendered inside <Phone>, which hides them from AT. */

const d = site.demo

/* ---------------------------------------------------------------- Search results */

export function SearchScreen() {
  const s = d.search
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="px-[16px] pt-[60px]">
        <div className="flex h-[44px] items-center gap-[9px] rounded-[14px] border border-line bg-sky px-[12px]">
          <Search className="size-[17px] text-muted-ink" strokeWidth={2.2} />
          <span className="flex-1 text-[14.5px] font-medium text-navy">
            {s.query}
            <span className="ml-px inline-block h-[16px] w-[1.5px] translate-y-[3px] bg-blue" />
          </span>
          <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-[#cbd5e1]">
            <X className="size-[11px] text-white" strokeWidth={3} />
          </span>
        </div>
        <div className="mt-[10px] flex gap-[6px] overflow-hidden">
          <span className="inline-flex h-[30px] shrink-0 items-center gap-[4px] rounded-full bg-blue px-[10px] text-[12px] font-semibold text-white">
            <MapPin className="size-[13px]" strokeWidth={2.4} />
            {s.location}
          </span>
          <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full border border-line text-navy">
            <SlidersHorizontal className="size-[13px]" strokeWidth={2.2} />
          </span>
          {s.filters.map((f) => (
            <span key={f} className="inline-flex h-[30px] shrink-0 items-center rounded-full border border-line px-[11px] text-[12px] font-medium text-slate">
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-[20px] flex items-baseline justify-between px-[18px]">
        <span className="text-[12px] font-semibold tracking-[0.02em] text-muted-ink uppercase">{s.resultsLabel}</span>
      </div>

      <div className="mt-[10px] flex flex-col gap-[12px] px-[14px]">
        {s.results.map((r, i) => (
          <div
            key={r.name}
            className={cn(
              "relative rounded-[18px] border bg-white p-[13px]",
              i === 0 ? "border-blue/25 shadow-[0_6px_18px_-8px_rgba(37,99,255,.35)]" : "border-line shadow-[0_2px_8px_-4px_rgba(15,45,91,.12)]",
            )}
          >
            <div className="flex gap-[11px]">
              <Avatar initials={r.initials} tone={r.tone} size={46} radius={14} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[14px] leading-[18px] font-semibold tracking-[-0.01em] text-navy">{r.name}</p>
                  <Heart className={cn("mt-px size-[15px] shrink-0", i === 0 ? "fill-blue text-blue" : "text-[#cbd5e1]")} strokeWidth={2} />
                </div>
                <p className="mt-[1px] text-[12px] leading-[16px] text-muted-ink">
                  {r.category} · {r.distance}
                </p>
                <div className="mt-[5px] flex items-center gap-[5px] text-[12px] leading-none">
                  <Stars rating={r.rating} />
                  <span className="font-semibold text-navy tnum">{r.rating}</span>
                  <span className="text-muted-ink tnum">({r.reviews})</span>
                </div>
              </div>
            </div>
            <div className="mt-[10px] flex flex-wrap gap-[5px] pl-[57px]">
              {r.instant && <InstantBadge />}
              {r.badges.map((b) => (
                <CredBadge key={b} label={b} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <TabBar active={1} />
    </div>
  )
}

function TabBar({ active }: { active: number }) {
  const icons = [House, Search, MessageCircle, UserRound]
  return (
    <div className="absolute inset-x-0 bottom-0 flex h-[82px] items-start justify-around border-t border-line bg-white/95 px-[10px] pt-[9px] backdrop-blur">
      {d.search.tabs.map((t, i) => {
        const Icon = icons[i]
        return (
          <span key={t} className={cn("flex w-[64px] flex-col items-center gap-[3px] text-[10px] font-medium", i === active ? "text-blue" : "text-muted-ink")}>
            <Icon className="size-[21px]" strokeWidth={i === active ? 2.4 : 2} />
            {t}
          </span>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------------- Business profile */

export function ProfileScreen() {
  const p = d.profile
  return (
    <div className="absolute inset-0 bg-white">
      {/* Cover */}
      <div className="relative h-[150px] overflow-hidden bg-[linear-gradient(135deg,#1D4ED8_0%,#2563FF_45%,#14B8A6_130%)]">
        <svg className="absolute -right-[30px] -bottom-[60px] text-white/15" width="220" height="220" viewBox="0 0 64 64" fill="none">
          <path d="M39.05 10.16 A19.5 19.5 0 0 1 52.84 23.95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M40.86 3.4 A26.5 26.5 0 0 1 59.6 22.14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="absolute -top-[40px] -left-[40px] size-[160px] rounded-full bg-white/10 blur-2xl" />
        <div className="absolute inset-x-[14px] top-[56px] flex justify-between">
          <RoundIcon><ChevronLeft className="size-[17px]" strokeWidth={2.4} /></RoundIcon>
          <span className="flex gap-[8px]">
            <RoundIcon><Share className="size-[14px]" strokeWidth={2.2} /></RoundIcon>
            <RoundIcon><Heart className="size-[14px]" strokeWidth={2.2} /></RoundIcon>
          </span>
        </div>
      </div>

      <div className="relative px-[18px]">
        <Avatar initials={p.initials} tone="blue" size={68} radius={20} className="-mt-[34px] ring-4 ring-white" />
        <p className="mt-[10px] text-[19px] leading-[24px] font-bold tracking-[-0.02em] text-navy">{p.name}</p>
        <p className="mt-[2px] text-[12px] text-muted-ink">{p.meta}</p>
        <div className="mt-[7px] flex items-center gap-[5px] text-[12.5px] leading-none">
          <Stars rating={p.rating} size={12} />
          <span className="font-semibold text-navy tnum">{p.rating}</span>
          <span className="text-muted-ink">· {p.reviews}</span>
        </div>
        <div className="mt-[10px] flex flex-wrap gap-[5px]">
          <InstantBadge />
          {p.badges.map((b) => (
            <CredBadge key={b} label={b} />
          ))}
        </div>
        <div className="mt-[12px] flex items-center gap-[8px] rounded-[12px] border border-line bg-sky px-[11px] py-[8px]">
          <span className="inline-flex size-[24px] items-center justify-center rounded-full bg-white ring-1 ring-line">
            <Zap className="size-[13px] fill-teal text-teal" strokeWidth={2} />
          </span>
          <span className="text-[12px] font-semibold text-navy">{p.replies}</span>
        </div>

        <p className="mt-[16px] text-[12px] font-semibold tracking-[0.02em] text-muted-ink uppercase">{p.servicesHeading}</p>
        <ul className="mt-[4px] divide-y divide-line">
          {p.services.map((sv) => (
            <li key={sv.name} className="flex items-center justify-between py-[9px]">
              <span className="text-[13.5px] font-medium text-navy">{sv.name}</span>
              <span className="text-right leading-none">
                <span className="block text-[13.5px] font-semibold text-navy tnum">{sv.price}</span>
                <span className="mt-[3px] block text-[10px] text-muted-ink">{p.vat}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sticky action bar */}
      <div className="absolute inset-x-0 bottom-0 flex gap-[8px] border-t border-line bg-white/95 px-[14px] pt-[10px] pb-[26px] shadow-[0_-8px_24px_-12px_rgba(15,45,91,.18)] backdrop-blur">
        <ActionButton icon={<PhoneIcon className="size-[15px]" strokeWidth={2.2} />} label={p.actions.call} />
        <ActionButton icon={<MessageCircle className="size-[15px]" strokeWidth={2.2} />} label={p.actions.message} />
        <span className="inline-flex h-[44px] flex-[1.25] items-center justify-center gap-[6px] rounded-full bg-blue text-[13.5px] font-semibold text-white shadow-[0_6px_14px_-6px_rgba(37,99,255,.7)]">
          <CalendarCheck className="size-[15px]" strokeWidth={2.2} />
          {p.actions.book}
        </span>
      </div>
    </div>
  )
}

function RoundIcon({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex size-[32px] items-center justify-center rounded-full bg-white/90 text-navy shadow-sm">{children}</span>
}

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex h-[44px] flex-1 items-center justify-center gap-[5px] rounded-full border border-line bg-white text-[13px] font-semibold text-navy">
      {icon}
      {label}
    </span>
  )
}

/* ---------------------------------------------------------------- Chat */

export function ChatScreen() {
  const c = d.chat
  return (
    <div className="absolute inset-0 flex flex-col bg-[#F7F9FC]">
      <div className="flex items-center gap-[10px] border-b border-line bg-white px-[12px] pt-[56px] pb-[10px]">
        <ChevronLeft className="size-[22px] text-blue" strokeWidth={2.4} />
        <Avatar initials={d.profile.initials} size={36} radius={11} />
        <div className="min-w-0">
          <p className="truncate text-[14px] leading-[18px] font-semibold tracking-[-0.01em] text-navy">{c.business}</p>
          <p className="mt-[1px] flex items-center gap-[5px] text-[11px] leading-[14px] font-medium text-teal-ink">
            <PulseDot size={6} />
            {c.status}
          </p>
        </div>
        <PhoneIcon className="ml-auto size-[18px] shrink-0 text-blue" strokeWidth={2.2} />
      </div>

      <div className="flex flex-1 flex-col gap-[10px] px-[14px] pt-[14px]">
        <span className="self-center rounded-full bg-white px-[10px] py-[3px] text-[10.5px] font-medium text-muted-ink ring-1 ring-line">{c.day}</span>

        <div className="max-w-[80%] self-end rounded-[18px] rounded-br-[6px] bg-blue px-[13px] py-[9px] text-[13.5px] leading-[19px] text-white shadow-[0_6px_14px_-8px_rgba(37,99,255,.7)]">
          {c.customer}
        </div>

        <div className="flex max-w-[88%] gap-[8px]">
          <DeskAvatar size={28} className="mt-auto mb-[2px]" />
          <div className="min-w-0">
            <p className="mb-[4px] ml-[2px] flex items-center gap-[5px] text-[10.5px] font-semibold text-teal-ink">
              {c.deskLabel}
              <span className="rounded-[4px] bg-white px-[4px] py-[2px] text-[9px] leading-[10px] font-semibold tracking-[0.04em] text-muted-ink uppercase ring-1 ring-line">AI</span>
            </p>
            <div className="rounded-[18px] rounded-bl-[6px] bg-teal-tint px-[13px] py-[9px] text-[13.5px] leading-[19px] text-navy ring-1 ring-teal/15">{c.desk}</div>
          </div>
        </div>

        <div className="ml-[36px] w-[214px] rounded-[16px] border border-line bg-white p-[11px] shadow-[0_4px_14px_-8px_rgba(15,45,91,.25)]">
          <div className="flex items-center gap-[8px]">
            <span className="inline-flex size-[30px] items-center justify-center rounded-[9px] bg-blue-tint">
              <CalendarCheck className="size-[15px] text-blue" strokeWidth={2.2} />
            </span>
            <div className="leading-none">
              <p className="text-[12.5px] font-semibold text-navy">{c.slot.title}</p>
              <p className="mt-[4px] text-[10.5px] text-muted-ink">
                {c.slot.day} · {c.slot.price}
              </p>
            </div>
          </div>
          <div className="mt-[10px] grid grid-cols-2 gap-[6px]">
            {c.slot.times.map((t, i) => (
              <span
                key={t}
                className={cn(
                  "inline-flex h-[30px] items-center justify-center rounded-full text-[12px] font-semibold tnum",
                  i === 0 ? "bg-blue text-white" : "border border-line text-navy",
                )}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[8px] border-t border-line bg-white px-[12px] pt-[9px] pb-[28px]">
        <span className="inline-flex size-[32px] items-center justify-center rounded-full bg-sky text-navy">
          <Plus className="size-[16px]" strokeWidth={2.2} />
        </span>
        <span className="flex h-[36px] flex-1 items-center rounded-full border border-line px-[13px] text-[13px] text-muted-ink">{c.placeholder}</span>
        <span className="inline-flex size-[34px] items-center justify-center rounded-full bg-blue text-white">
          <SendHorizontal className="size-[15px]" strokeWidth={2.2} />
        </span>
      </div>
    </div>
  )
}

/** Small floating cards that sit beside the hero phone. */
export function FloatingDeskCard({ className }: { className?: string }) {
  const f = d.floating.desk
  return (
    <div className={cn("flex w-[248px] items-start gap-[10px] rounded-[18px] border border-line bg-white/95 p-[12px] shadow-overlay backdrop-blur", className)}>
      <span className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-[11px] bg-blue-tint">
        <Mark size={24} />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-[6px] text-[12px] leading-[16px] font-semibold text-teal-ink">
          {f.label}
          <PulseDot size={6} />
        </p>
        <p className="mt-[2px] text-[13px] leading-[18px] font-medium text-navy">{f.text}</p>
      </div>
    </div>
  )
}

export function FloatingBookedCard({ className }: { className?: string }) {
  const f = d.floating.booked
  return (
    <div className={cn("flex items-center gap-[10px] rounded-[18px] border border-line bg-white/95 py-[10px] pr-[16px] pl-[10px] shadow-overlay backdrop-blur", className)}>
      <span className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-teal-tint">
        <svg viewBox="0 0 24 24" className="size-[18px] text-teal" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 10 17 19 7.5" />
        </svg>
      </span>
      <div className="leading-none">
        <p className="text-[13px] font-semibold text-navy">{f.label}</p>
        <p className="mt-[5px] text-[12px] text-muted-ink">{f.text}</p>
      </div>
    </div>
  )
}
