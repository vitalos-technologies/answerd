import { cn } from "@/lib/utils"
import { Mark } from "./Mark"

/**
 * The Answerd desk's icon: the Answerd mark, not a robot (design review). Drop-in for a Lucide icon:
 * size it with a class (size-4, size-5, ...); "current" (default) follows the text colour, "color" is the full-colour mark.
 */
export function DeskIcon({ className, variant = "current" }: { className?: string; variant?: "current" | "color"; "aria-hidden"?: boolean | "true" | "false" }) {
  return <Mark size={24} variant={variant} className={cn("size-5", className)} />
}
