import { ImageResponse } from "next/og"
import { MarkSvg } from "@/components/brand/mark-svg"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// White Answerd mark (the brand board's tile version, components/brand/mark-svg.tsx) on brand blue.

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563FF",
        }}
      >
        <MarkSvg size={128} white />
      </div>
    ),
    { ...size },
  )
}
