// Super admin section of the admin sidebar (S-01 to S-10). Only the super admin sees it.
import { BadgePoundSterling, Crown, Eye, Plug, Receipt, ShieldCheck, SlidersHorizontal, ToggleRight, TrendingUp, UsersRound } from "lucide-react"

export const SUPER_NAV = [
  { href: "/admin/super", label: "Owner overview", icon: Crown, id: "S-01" },
  { href: "/admin/super/revenue", label: "Revenue and plans", icon: BadgePoundSterling, id: "S-02" },
  { href: "/admin/super/costs", label: "Costs and margins", icon: Receipt, id: "S-03" },
  { href: "/admin/super/growth", label: "Growth", icon: TrendingUp, id: "S-04" },
  { href: "/admin/super/team", label: "Team and roles", icon: UsersRound, id: "S-05" },
  { href: "/admin/super/pricing", label: "Pricing and rules", icon: SlidersHorizontal, id: "S-06" },
  { href: "/admin/super/switches", label: "Platform switches", icon: ToggleRight, id: "S-07" },
  { href: "/admin/super/integrations", label: "Integrations", icon: Plug, id: "S-08" },
  { href: "/admin/super/impersonate", label: "Impersonate and data", icon: Eye, id: "S-09" },
  { href: "/admin/super/security", label: "Security log", icon: ShieldCheck, id: "S-10" },
]

