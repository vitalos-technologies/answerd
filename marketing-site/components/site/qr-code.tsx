import QRCode from "qrcode"
import { cn } from "@/lib/utils"
import { DOWNLOAD_URL } from "@/content/site"

/** Server-rendered QR code (no client JS): the download link by default, or any `url` (e.g. a listing's universal link). */
export async function QrCode({ size = 128, className, label = "QR code: scan to download Answerd", dark = "#0F2D5B", url = DOWNLOAD_URL }: { size?: number; className?: string; label?: string; dark?: string; url?: string }) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark, light: "#0000" } })
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
