"use client"
import * as React from "react"
import { Camera, Clock, FileCheck2, Upload } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Chip } from "@/components/answerd/Fields"
import { BottomSheet } from "@/components/answerd/Sheet"
import { useStore } from "@/lib/store"
import { fmtTime } from "@/lib/time"
import { DOCUMENT_KINDS, ensureClaim, latestClaim } from "./helpers"

/** A mock camera: a viewfinder with a document outline and a shutter. Returns a file name. */
export function MockCamera({ open, onClose, onCapture, title = "Take a photo" }: { open: boolean; onClose: () => void; onCapture: (fileName: string) => void; title?: string }) {
  const clock = useStore((s) => s.clock)
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-navy" role="img" aria-label="Camera viewfinder (prototype)">
        <div className="h-[70%] w-[72%] rounded-lg border-2 border-dashed border-white/70 bg-white/10" />
        <p className="absolute bottom-3 left-0 right-0 text-center t-caption text-white/80">Line up the page inside the frame</p>
      </div>
      <Button block className="mt-4" onClick={() => onCapture(`Camera capture ${fmtTime(clock).replace(":", ".")}.jpg`)}>
        <Camera /> Take photo
      </Button>
    </BottomSheet>
  )
}

/**
 * B-07 body: utility bill, bank letter, insurance schedule or HMRC letter in the business name; camera or file.
 * Submitting sets the claim to pending and shows the pending screen; onDone goes on to the setup checklist.
 */
export function DocumentUpload({ listingId, onDone }: { listingId: string; onDone: () => void }) {
  const s = useStore()
  const l = s.listings.find((x) => x.id === listingId)
  const prev = latestClaim(s, listingId)
  const [kind, setKind] = React.useState<string>(DOCUMENT_KINDS[0])
  const [file, setFile] = React.useState("")
  const [camera, setCamera] = React.useState(false)
  const [error, setError] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const closeCamera = React.useCallback(() => setCamera(false), [])
  const fileRef = React.useRef<HTMLInputElement>(null)
  if (!l) return null

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <span className="inline-flex size-20 items-center justify-center rounded-full bg-amber-tint text-amber-ink">
          <Clock className="size-9" aria-hidden />
        </span>
        <h1 className="mt-5 t-title">Thanks. It&apos;s with our team</h1>
        <p className="mt-2 t-body text-slate">We&apos;ll check your {kind.toLowerCase()} within 1 working day and text you when {l.name} is verified. You can set up your profile in the meantime.</p>
        <Button block className="mt-8" onClick={onDone}>
          Set up your profile
        </Button>
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!file) return setError("Add a photo or file of your document")
        const claimId = ensureClaim(listingId, "document")
        const res = useStore.getState().verifyClaim(claimId, "document", { document: file, documentKind: kind })
        if (!res.ok) return setError(res.error ?? "We couldn't send that. Try again.")
        setSubmitted(true)
      }}
    >
      <div>
        <h1 className="t-title">Upload a document</h1>
        <p className="mt-1 t-body text-slate">It must show the name {l.name} and be dated in the last 3 months.</p>
      </div>
      {(prev?.status === "rejected" || prev?.status === "more_info") && (
        <Banner tone="error" title={prev.status === "rejected" ? "We couldn't approve your last document" : "We need a bit more"}>
          {prev.reason ?? "It didn't match the business name."} Upload again below.
        </Banner>
      )}
      <fieldset className="min-w-0">
        <legend className="mb-2 t-label text-navy">Document type</legend>
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_KINDS.map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {k}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setCamera(true)} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white p-3 t-label text-navy hover:border-blue">
          <Camera className="size-6 text-blue" aria-hidden /> Take a photo
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white p-3 t-label text-navy hover:border-blue">
          <Upload className="size-6 text-blue" aria-hidden /> Choose a file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          aria-label="Choose a file"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              setFile(f.name)
              setError("")
            }
          }}
        />
      </div>
      {file && (
        <div className="flex items-center gap-3 rounded-2xl bg-teal-tint p-3.5" role="status">
          <FileCheck2 className="size-5 shrink-0 text-teal-ink" aria-hidden />
          <span className="min-w-0 flex-1 truncate t-label text-navy">{file}</span>
          <Button size="sm" variant="ghost" onClick={() => setFile("")}>
            Remove
          </Button>
        </div>
      )}
      {error && (
        <p className="t-caption text-red" role="alert">
          {error}
        </p>
      )}
      <p className="t-caption text-muted-ink">We&apos;ll check it within 1 working day. Only the Answerd team sees it.</p>
      <Button block type="submit">
        Send for checking
      </Button>
      <MockCamera
        open={camera}
        onClose={closeCamera}
        onCapture={(name) => {
          setFile(name)
          setError("")
          setCamera(false)
        }}
      />
    </form>
  )
}
