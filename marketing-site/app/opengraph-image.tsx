import { ImageResponse } from "next/og"
import { SITE_URL, site } from "@/content/site"
import { MarkSvg } from "@/components/brand/mark-svg"

export const alt = site.seo.ogAlt
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const NAVY = "#0F2D5B"
const SLATE = "#475569"
const DOMAIN = SITE_URL.replace(/^https?:\/\//, "")


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
