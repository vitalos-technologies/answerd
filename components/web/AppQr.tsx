import QRCode from "qrcode"
import { SITE } from "./data"
import { cn } from "@/lib/utils"

/** Server-rendered QR code (W-26) pointing at the app download link. Props: size in px, url (defaults to /get-the-app). */
export async function AppQr({ size = 160, url = `${SITE}/get-the-app?src=qr`, className }: { size?: number; url?: string; className?: string }) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0F2D5BFF", light: "#FFFFFFFF" } })
  return (
    <figure className={cn("inline-flex flex-col items-center gap-2", className)}>
      <span
        role="img"
        aria-label={`QR code for ${url.replace(/^https:\/\//, "").replace(/\?.*$/, "")}`}
        className="block rounded-xl border border-line bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption className="t-caption text-muted-ink">Scan with your phone camera</figcaption>
    </figure>
  )
}
