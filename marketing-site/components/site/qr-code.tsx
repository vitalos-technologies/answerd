import QRCode from "qrcode"
import { cn } from "@/lib/utils"
import { DOWNLOAD_URL } from "@/content/site"

/** Server-rendered QR code (no client JS) for the download link. */
export async function QrCode({ size = 128, className, label = "QR code: scan to download Answerd", dark = "#0F2D5B" }: { size?: number; className?: string; label?: string; dark?: string }) {
  const svg = await QRCode.toString(DOWNLOAD_URL, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark, light: "#0000" } })
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-block [&>svg]:size-full", className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
