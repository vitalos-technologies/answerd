import { notFound } from "next/navigation"
import { Placeholder } from "@/components/shells/Placeholder"
import { LEAF_CATEGORIES } from "@/lib/categories"

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  if (!LEAF_CATEGORIES.some((c) => c.slug === category)) notFound()
  return <Placeholder id="W-03" surface="web" />
}
