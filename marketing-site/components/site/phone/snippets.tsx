import { CircleCheck, PhoneIncoming } from "lucide-react"
import { Mark } from "@/components/brand/Mark"
import { cn } from "@/lib/utils"
import { site } from "@/content/site"
import { PhoneCrop } from "./device"
import { AskConversation } from "./motion"
import { Avatar, DeskAvatar, PulseDot } from "./parts"

/* Phone-screen snippets for the Why Answerd feature cards. */

const d = site.demo

const WAVE = [6, 10, 16, 9, 18, 12, 20, 14, 8, 15, 19, 11, 7, 13, 17, 9, 12, 6, 10, 14, 8, 5]

export function PickupSnippet() {
  const p = d.pickup
  return (
    <PhoneCrop label="App screen: a call to Swift Plumbing & Heating answered by the Answerd desk, with its reply">
      <div className="px-[12px] pt-[4px]">
        <div className="rounded-[18px] bg-navy p-[12px] text-white shadow-[0_10px_24px_-14px_rgba(15,45,91,.8)]">
          <div className="flex items-center gap-[10px]">
            <Avatar initials={d.profile.initials} size={36} radius={11} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] leading-[17px] font-semibold">{p.business}</p>
              <p className="mt-[2px] flex items-center gap-[5px] text-[10.5px] leading-[14px] font-semibold text-[#5EEAD4]">
                <PulseDot size={6} />
                {p.answered}
              </p>
            </div>
            <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full bg-teal">
              <PhoneIncoming className="size-[14px] text-white" strokeWidth={2.4} />
            </span>
          </div>
          <div className="mt-[10px] flex h-[18px] items-center justify-between">
            {WAVE.map((h, i) => (
              <span key={i} className="w-[3px] rounded-full bg-[linear-gradient(180deg,#5EEAD4,#14B8A6)]" style={{ height: h * 0.85, opacity: i < 15 ? 1 : 0.35 }} />
            ))}
            <span className="ml-[6px] text-[11px] font-semibold text-white/85 tnum">{p.duration}</span>
          </div>
        </div>

        <div className="mt-[12px] flex items-end gap-[8px]">
          <DeskAvatar size={26} />
          <div className="rounded-[18px] rounded-bl-[6px] bg-teal-tint px-[12px] py-[8px] text-[12.5px] leading-[17px] text-navy ring-1 ring-teal/15">{p.reply}</div>
        </div>
      </div>
    </PhoneCrop>
  )
}

export function VerifiedSnippet() {
  const v = d.verified
  return (
    <PhoneCrop label="App screen: Palace Electrics profile with verified Gas Safe, NICEIC, Insured and DBS badges">
      <div className="px-[14px] pt-[6px]">
        <div className="flex items-center gap-[10px]">
          <Avatar initials={v.initials} tone="teal" size={40} radius={12} />
          <div className="min-w-0">
            <p className="truncate text-[14px] leading-[18px] font-semibold text-navy">{v.name}</p>
            <p className="text-[11.5px] text-muted-ink">{v.meta}</p>
          </div>
        </div>
        <div className="mt-[12px] grid grid-cols-2 gap-[7px]">
          {v.credentials.map((c) => (
            <div key={c} className="flex items-center gap-[7px] rounded-[12px] border border-line bg-white px-[9px] py-[8px] shadow-[0_2px_6px_-4px_rgba(15,45,91,.15)]">
              <CircleCheck className="size-[18px] shrink-0 fill-teal text-white" strokeWidth={2.4} />
              <span className="min-w-0 leading-none">
                <span className="block truncate text-[12px] font-semibold text-navy">{c}</span>
                <span className="mt-[3px] block text-[10px] font-medium text-teal-ink">{v.verifiedLabel}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-[11px] flex items-center justify-center gap-[5px] text-[10.5px] font-medium text-muted-ink">
          <Mark size={14} />
          {v.checked}
        </p>
      </div>
    </PhoneCrop>
  )
}

export function BookSnippet() {
  const b = d.book
  return (
    <PhoneCrop label="App screen: choosing a booking date and the 10am time slot">
      <div className="px-[14px] pt-[6px]">
        <div className="flex items-baseline justify-between">
          <p className="text-[15px] font-bold tracking-[-0.01em] text-navy">{b.heading}</p>
          <p className="text-[11.5px] font-medium text-muted-ink">{b.month}</p>
        </div>
        <div className="mt-[10px] grid grid-cols-5 gap-[6px]">
          {b.days.map((day, i) => (
            <span
              key={day.date}
              className={cn(
                "flex flex-col items-center rounded-[12px] py-[7px] leading-none",
                i === b.selectedDay ? "bg-navy text-white" : "border border-line bg-white text-navy",
              )}
            >
              <span className={cn("text-[10px] font-medium", i === b.selectedDay ? "text-white/75" : "text-muted-ink")}>{day.dow}</span>
              <span className="mt-[5px] text-[15px] font-bold tnum">{day.date}</span>
            </span>
          ))}
        </div>
        <div className="mt-[12px] grid grid-cols-3 gap-[6px]">
          {b.times.map((t, i) => (
            <span
              key={t}
              className={cn(
                "inline-flex h-[32px] items-center justify-center rounded-full text-[12.5px] font-semibold tnum",
                i === b.selectedTime ? "bg-blue text-white shadow-[0_6px_14px_-6px_rgba(37,99,255,.75)]" : "border border-line bg-white text-navy",
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-[11px] text-center text-[11px] font-medium text-muted-ink">{b.cta}</p>
      </div>
    </PhoneCrop>
  )
}

export function AskSnippet() {
  return (
    <PhoneCrop label="App screen: Ask Answerd offering to help find the right local business">
      <div className="px-[14px] pt-[4px]">
        <div className="flex items-center gap-[8px] border-b border-line pb-[10px]">
          <span className="inline-flex size-[30px] items-center justify-center rounded-[10px] bg-blue-tint">
            <Mark size={21} />
          </span>
          <p className="text-[14px] font-semibold tracking-[-0.01em] text-navy">{d.ask.title}</p>
          <span className="ml-auto rounded-[4px] px-[4px] py-[2px] text-[9px] leading-[10px] font-semibold tracking-[0.04em] text-muted-ink uppercase ring-1 ring-line">AI</span>
        </div>
        <div className="pt-[14px]">
          <AskConversation avatar={<DeskAvatar size={28} className="mb-[2px]" />} bubble={site.why.askBubble} chips={site.askbridge.chips.filter((_, i) => i !== 1)} />
        </div>
      </div>
    </PhoneCrop>
  )
}

export const FEATURE_SNIPPETS: Record<string, () => React.ReactElement> = {
  pickup: PickupSnippet,
  verified: VerifiedSnippet,
  book: BookSnippet,
  ask: AskSnippet,
}
