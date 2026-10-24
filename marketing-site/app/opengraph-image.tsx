import { ImageResponse } from "next/og"
import { SITE_URL, site } from "@/content/site"

export const alt = site.seo.ogAlt
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const NAVY = "#0F2D5B"
const SLATE = "#475569"
const DOMAIN = SITE_URL.replace(/^https?:\/\//, "")

// The Answerd mark as inline SVG (same geometry as components/brand/Mark.tsx, which uses hooks and can't render here).
const HANDSET =
  "M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"

function MarkSvg({ size: s, white = false }: { size: number; white?: boolean }) {
  if (white)
    return (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <path d="M20.6 53.2 A21 21 0 1 0 9.6 41.4 L5.2 59.2 Z" fill="#FFFFFF" />
        <path d={HANDSET} fill="#2563FF" transform="translate(14.6 19.4) scale(1.22)" />
        <path d="M39.05 10.16 A19.5 19.5 0 0 1 52.84 23.95" stroke="#FFFFFF" strokeWidth="5.2" strokeLinecap="round" />
        <path d="M40.86 3.4 A26.5 26.5 0 0 1 59.6 22.14" stroke="#14B8A6" strokeWidth="5.2" strokeLinecap="round" />
      </svg>
    )
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="b" x1="48" y1="14" x2="10" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B7BFF" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="a" x1="38" y1="10" x2="54" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2B8CF5" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <path d="M20.6 53.2 A21 21 0 1 0 9.6 41.4 L5.2 59.2 Z" fill="url(#b)" />
      <path d={HANDSET} fill="#FFFFFF" transform="translate(14.6 19.4) scale(1.22)" />
      <path d="M39.05 10.16 A19.5 19.5 0 0 1 52.84 23.95" stroke="url(#a)" strokeWidth="5.2" strokeLinecap="round" />
      <path d="M40.86 3.4 A26.5 26.5 0 0 1 59.6 22.14" stroke="#14B8A6" strokeWidth="5.2" strokeLinecap="round" />
    </svg>
  )
}

/** Inter from Google Fonts, subset to the text we draw. Returns null offline, so the image falls back to the bundled font. */
async function loadInter(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await (await fetch(cssUrl, { signal: AbortSignal.timeout(4000) })).text()
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (!src) return null
    const res = await fetch(src, { signal: AbortSignal.timeout(4000) })
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const headline = site.hero.headline
  const text = `${site.name}${headline}${DOMAIN}`
  const [bold, extraBold] = await Promise.all([loadInter(700, text), loadInter(800, text)])
  const fonts = [
    ...(bold ? [{ name: "Inter", data: bold, weight: 700 as const, style: "normal" as const }] : []),
    ...(extraBold ? [{ name: "Inter", data: extraBold, weight: 800 as const, style: "normal" as const }] : []),
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          backgroundColor: "#F8FAFC",
          backgroundImage:
            "radial-gradient(circle at 88% 18%, rgba(37,99,255,0.20), rgba(37,99,255,0) 46%), radial-gradient(circle at 100% 100%, rgba(20,184,166,0.14), rgba(20,184,166,0) 40%), radial-gradient(circle at 0% 0%, #FFFFFF, rgba(255,255,255,0) 60%)",
          fontFamily: fonts.length ? "Inter" : undefined,
        }}
      >
        {/* App tile on the right, echoing the store icon */}
        <div
          style={{
            position: "absolute",
            right: 104,
            top: 178,
            width: 260,
            height: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 60,
            backgroundImage: "linear-gradient(145deg, #3B7BFF, #1D4ED8)",
            boxShadow: "0 30px 70px rgba(37,99,255,0.30), 0 8px 20px rgba(15,45,91,0.12)",
            transform: "rotate(-6deg)",
          }}
        >
          <MarkSvg size={180} white />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <MarkSvg size={84} />
          <div style={{ display: "flex", fontSize: 60, fontWeight: 800, color: NAVY, letterSpacing: "-0.035em" }}>{site.name}</div>
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 900,
            fontSize: 84,
            lineHeight: 1.06,
            fontWeight: 700,
            color: NAVY,
            letterSpacing: "-0.03em",
          }}
        >
          {headline}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700, color: SLATE }}>
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, backgroundColor: "#14B8A6" }} />
          {DOMAIN}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  )
}
