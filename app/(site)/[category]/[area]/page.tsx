import { notFound } from "next/navigation"
import { Placeholder } from "@/components/shells/Placeholder"
import { LEAF_CATEGORIES } from "@/lib/categories"
import { areaBySlug } from "@/lib/geo"

export default async function Page({ params }: { params: Promise<{ category: string; area: string }> }) {
  const { category, area } = await params
  if (!LEAF_CATEGORIES.some((c) => c.slug === category) || !areaBySlug(area)) notFound()
  return <Placeholder id="W-04" surface="web" />
}
