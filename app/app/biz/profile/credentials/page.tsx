"use client"
import { BizScreen } from "@/components/app/biz"
import { CredentialsForm } from "@/components/biz/profile"

/** B-16: Credentials. Uploads go to pending; verified ones become listing badges. */
export default function CredentialsPage() {
  return <BizScreen id="B-16" title="Credentials">{({ biz }) => <CredentialsForm businessId={biz!.id} />}</BizScreen>
}
