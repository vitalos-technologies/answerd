import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// White Answerd mark (geometry from components/brand/Mark.tsx, "white" variant) on brand blue.
const HANDSET =
  "M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"

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
        <svg width={122} height={122} viewBox="0 0 64 64" fill="none">
          <path d="M20.6 53.2 A21 21 0 1 0 9.6 41.4 L5.2 59.2 Z" fill="#FFFFFF" />
          <path d={HANDSET} fill="#2563FF" transform="translate(14.6 19.4) scale(1.22)" />
          <path d="M39.05 10.16 A19.5 19.5 0 0 1 52.84 23.95" stroke="#FFFFFF" strokeWidth="5.2" strokeLinecap="round" />
          <path d="M40.86 3.4 A26.5 26.5 0 0 1 59.6 22.14" stroke="#14B8A6" strokeWidth="5.2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
