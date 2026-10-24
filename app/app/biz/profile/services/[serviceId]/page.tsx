"use client"
import { use } from "react"
import { useRouter } from "next/navigation"
import { BizScreen } from "@/components/app/biz"
import { ServiceForm } from "@/components/biz/profile"

/** B-12: Edit service ("new" adds one). Save and Delete return to B-11. */
export default function EditService({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = use(params)
  const router = useRouter()
  const back = "/app/biz/profile/services"
  return (
    <BizScreen id="B-12" title={serviceId === "new" ? "Add service" : "Edit service"} back={back}>
      {({ biz }) => <ServiceForm businessId={biz!.id} serviceId={serviceId} onSaved={() => router.push(back)} onDeleted={() => router.push(back)} />}
    </BizScreen>
  )
}
