"use client"
import { BizScreen } from "@/components/app/biz"
import { BusinessNotificationPrefs } from "@/components/biz/account/BusinessNotificationPrefs"

/** B-39 Business notifications */
export default function BizNotificationsPage() {
  return (
    <BizScreen id="B-39" title="Notifications" back="/app/biz/more">
      {({ biz, readOnly }) => (
        <div className="px-4 py-4">
          <BusinessNotificationPrefs businessId={biz!.id} readOnly={readOnly} />
        </div>
      )}
    </BizScreen>
  )
}
