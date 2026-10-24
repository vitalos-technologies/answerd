"use client"
import * as React from "react"
import { GetAppButton } from "./get-app"
import { useConsent } from "./consent"

const MOBILE = "(max-width: 767.98px)"

function subscribeMobile(cb: () => void) {
  const mq = window.matchMedia(MOBILE)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** True below 768 px; false on the server. */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE).matches,
    () => false,
  )
}

/** Whether the element with `id` intersects the viewport. Starts as `initial` until the observer reports. */
function useInView(id: string, initial: boolean) {
  const [inView, setInView] = React.useState(initial)
  React.useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 })
    const el = document.getElementById(id)
    if (el) {
      io.observe(el)
      return () => io.disconnect()
    }
    // Not rendered yet (e.g. streamed in later): watch for it, then stop watching.
    const mo = new MutationObserver(() => {
      const found = document.getElementById(id)
      if (found) {
        mo.disconnect()
        io.observe(found)
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io.disconnect()
    }
  }, [id])
  return inView
}

/**
 * Mobile-only sticky "Get the app" bar. Appears once the hero has scrolled away, hides again over the hero
 * and the download section, and stays hidden while the cookie banner is asking. It publishes its height as
 * `--app-bar-h` on <html> so the chat pill can sit above it.
 */
export function MobileAppBarClient({ label }: { label: string }) {
  const isMobile = useIsMobile()
  const consent = useConsent()
  const heroInView = useInView("hero", true)
  const downloadInView = useInView("download", false)
  const show = isMobile && !!consent && !heroInView && !downloadInView
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const root = document.documentElement
    if (!show || !ref.current) {
      root.style.setProperty("--app-bar-h", "0px")
      return
    }
    const el = ref.current
    const ro = new ResizeObserver(() => root.style.setProperty("--app-bar-h", `${el.offsetHeight}px`))
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.setProperty("--app-bar-h", "0px")
    }
  }, [show])

  return (
    // Always rendered; slides in and out with CSS. While hidden it is inert, so it can't take focus.
    <div
      ref={ref}
      data-show={show || undefined}
      inert={!show}
      className="invisible fixed inset-x-0 bottom-0 z-40 translate-y-full border-t border-line bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,45,91,0.08)] transition-[translate,visibility] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] supports-backdrop-filter:backdrop-blur-xl data-show:visible data-show:translate-y-0 motion-reduce:transition-none md:hidden"
    >
      <GetAppButton icon label={label} className="w-full" />
    </div>
  )
}
