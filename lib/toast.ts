"use client"
import { create } from "zustand"

export interface ToastItem {
  id: number
  text: string
  undo?: () => void
}

let n = 0

export const useToasts = create<{ items: ToastItem[]; dismiss: (id: number) => void }>((set) => ({
  items: [],
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

/** Navy pill, 4 s, optional Undo. */
export function toast(text: string, undo?: () => void) {
  const id = ++n
  useToasts.setState((s) => ({ items: [...s.items.slice(-2), { id, text, undo }] }))
  if (typeof window !== "undefined") setTimeout(() => useToasts.getState().dismiss(id), 4000)
}
