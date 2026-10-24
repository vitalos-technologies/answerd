"use client"
import * as React from "react"
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { ArrowLeft, ArrowRight, Camera, GripVertical, ImagePlus, Star, Trash2 } from "lucide-react"
import { IconButton } from "@/components/answerd/Button"
import { PhotoTile } from "@/components/answerd/Media"
import { MockCamera } from "@/components/biz/claim/DocumentUpload"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { uid } from "@/lib/prng"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Business, Photo } from "@/lib/types"
import { FormSkeleton, SaveBar, useBizRecord, inputClsSm } from "./fields"
import type { EditorProps } from "./DetailsForm"

export const MAX_PHOTOS = 30
const ICONS = ["Wrench", "Sparkles", "Hammer", "Truck", "BadgeCheck", "House", "Flame", "Users"]

function hueOf(s: string) {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

/** B-15: grid upload, set cover, reorder (drag or arrows), captions. Max 30. */
export function PhotosForm(props: EditorProps) {
  const { hydrated, biz } = useBizRecord(props.businessId)
  if (!hydrated || !biz) return <FormSkeleton rows={3} />
  return <PhotosInner key={biz.id} biz={biz} {...props} />
}

function Tile({ photo, index, count, cover, onCover, onMove, onDelete, onCaption }: { photo: Photo; index: number; count: number; cover: boolean; onCover: () => void; onMove: (dir: -1 | 1) => void; onDelete: () => void; onCaption: (v: string) => void }) {
  const { attributes, listeners, setNodeRef: setDragRef, setActivatorNodeRef, transform, isDragging } = useDraggable({ id: photo.id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: photo.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <li
      ref={(el) => {
        setDragRef(el)
        setDropRef(el)
      }}
      style={style}
      className={cn("rounded-2xl border bg-white p-2 transition-shadow", isDragging ? "z-20 border-blue shadow-overlay" : isOver ? "border-blue ring-2 ring-blue/30" : "border-line")}
    >
      <div className="relative">
        <PhotoTile hue={photo.hue} icon={photo.icon} className="aspect-[4/3] w-full" label={photo.caption || `Photo ${index + 1}`} />
        {cover && <span className="absolute left-1.5 top-1.5 rounded-full bg-navy px-2 py-0.5 t-caption text-white">Cover</span>}
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          aria-label={`Drag to reorder photo ${index + 1}`}
          aria-roledescription="sortable photo"
          className="absolute bottom-1.5 left-1.5 inline-flex size-11 cursor-grab touch-none items-center justify-center rounded-full bg-white/95 text-navy shadow-card active:cursor-grabbing"
        >
          <GripVertical className="size-5" aria-hidden />
        </button>
        <IconButton label={cover ? `Photo ${index + 1} is your cover` : `Set photo ${index + 1} as cover`} tone="white" onClick={onCover} className="absolute bottom-1.5 right-1.5" aria-pressed={cover}>
          <Star className={cn(cover && "fill-amber text-amber-ink")} />
        </IconButton>
      </div>
      <label className="sr-only" htmlFor={`cap-${photo.id}`}>
        Caption for photo {index + 1}
      </label>
      <input id={`cap-${photo.id}`} value={photo.caption} onChange={(e) => onCaption(e.target.value)} maxLength={80} placeholder="Add a caption" className={cn(inputClsSm, "mt-2")} />
      <div className="mt-1 flex items-center justify-between">
        <div className="flex">
          <IconButton label={`Move photo ${index + 1} earlier`} onClick={() => onMove(-1)} disabled={index === 0}>
            <ArrowLeft />
          </IconButton>
          <IconButton label={`Move photo ${index + 1} later`} onClick={() => onMove(1)} disabled={index === count - 1}>
            <ArrowRight />
          </IconButton>
        </div>
        <IconButton label={`Delete photo ${index + 1}`} onClick={onDelete} className="text-red hover:bg-red-tint">
          <Trash2 />
        </IconButton>
      </div>
    </li>
  )
}

function PhotosInner({ biz, onSaved, className }: EditorProps & { biz: Business }) {
  const updateBusiness = useStore((s) => s.updateBusiness)
  const [photos, setPhotos] = React.useState<Photo[]>(biz.photos)
  const [coverId, setCoverId] = React.useState<string | undefined>(biz.coverPhotoId ?? biz.photos[0]?.id)
  const [camera, setCamera] = React.useState(false)
  const closeCamera = React.useCallback(() => setCamera(false), [])
  const fileRef = React.useRef<HTMLInputElement>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor))
  const full = photos.length >= MAX_PHOTOS
  const cover = photos.find((p) => p.id === coverId) ?? photos[0]

  const add = (names: string[]) => {
    const room = MAX_PHOTOS - photos.length
    if (room <= 0) return toast(`You can add up to ${MAX_PHOTOS} photos`)
    const take = names.slice(0, room)
    const added = take.map((n, i) => ({ id: uid("ph"), caption: n.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 80), hue: hueOf(n + photos.length + i), icon: ICONS[(photos.length + i) % ICONS.length]! }))
    setPhotos((ps) => [...ps, ...added])
    if (!coverId) setCoverId(added[0]?.id)
    toast(names.length > room ? `Added ${take.length}. That's the maximum of ${MAX_PHOTOS}.` : `${take.length} photo${take.length === 1 ? "" : "s"} added. Save to publish.`)
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length || from === to) return
    setPhotos((ps) => {
      const next = [...ps]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item!)
      return next
    })
  }
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    move(
      photos.findIndex((p) => p.id === e.active.id),
      photos.findIndex((p) => p.id === e.over!.id),
    )
  }

  return (
    <form
      className={className ?? "space-y-4 px-4 pt-5"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        updateBusiness(biz.id, { photos, coverPhotoId: cover?.id })
        toast("Photos saved")
        onSaved?.()
      }}
    >
      <div className="flex items-center justify-between">
        <p className="t-label font-normal text-slate tnum">
          {photos.length} of {MAX_PHOTOS} photos
        </p>
        <p className="t-caption text-muted-ink">Drag or use the arrows to reorder</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={full} onClick={() => fileRef.current?.click()} className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line bg-white p-3 t-label text-navy hover:border-blue disabled:opacity-50">
          <ImagePlus className="size-6 text-blue" aria-hidden /> Upload photos
        </button>
        <button type="button" disabled={full} onClick={() => setCamera(true)} className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line bg-white p-3 t-label text-navy hover:border-blue disabled:opacity-50">
          <Camera className="size-6 text-blue" aria-hidden /> Take a photo
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload photos"
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name)
            if (names.length) add(names)
            e.target.value = ""
          }}
        />
      </div>
      <DataGate
        isEmpty={photos.length === 0}
        rows={2}
        empty={
          <div className="rounded-2xl bg-white p-6 text-center">
            <p className="t-subhead">No photos yet</p>
            <p className="mt-1 t-label font-normal text-slate">Listings with photos get more enquiries. Add your van, your team or recent work.</p>
          </div>
        }
      >
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <ul className="grid grid-cols-2 gap-3" aria-label="Your photos">
            {photos.map((p, i) => (
              <Tile
                key={p.id}
                photo={p}
                index={i}
                count={photos.length}
                cover={p.id === cover?.id}
                onCover={() => {
                  setCoverId(p.id)
                  toast(`Photo ${i + 1} set as cover`)
                }}
                onMove={(dir) => move(i, i + dir)}
                onDelete={() => {
                  setPhotos((ps) => ps.filter((x) => x.id !== p.id))
                  if (p.id === coverId) setCoverId(undefined)
                }}
                onCaption={(v) => setPhotos((ps) => ps.map((x) => (x.id === p.id ? { ...x, caption: v } : x)))}
              />
            ))}
          </ul>
        </DndContext>
      </DataGate>
      <SaveBar />
      <MockCamera
        open={camera}
        onClose={closeCamera}
        onCapture={(name) => {
          setCamera(false)
          add([name])
        }}
      />
    </form>
  )
}
