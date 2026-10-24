"use client"
import { BizScreen } from "@/components/app/biz"
import { ServicesList } from "@/components/biz/profile"

/** B-11: Services and prices. */
export default function ServicesPage() {
  return <BizScreen id="B-11" title="Services and prices">{({ biz }) => <ServicesList businessId={biz!.id} />}</BizScreen>
}
