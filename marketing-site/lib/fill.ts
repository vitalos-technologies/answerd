/** Fills {placeholders} in a copy string. Client-safe (copy itself arrives as props). */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m))
}
