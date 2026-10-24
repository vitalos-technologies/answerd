"use client"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { withSuspense } from "@/components/app/helpers"
import { AreaForm, BookingSettingsForm, CredentialsForm, DetailsForm, HoursForm, PhotosForm, ServiceForm, ServicesList, SetupChecklist } from "@/components/biz/profile"
import { DashPage, LinkTabs } from "@/components/dashboard/kit"
import { PROFILE_TABS, profileHref, setupStepHref, type ProfileTab } from "@/components/dashboard/links"

const TAB_INTRO: Record<ProfileTab, string> = {
  details: "Name, description, categories and how customers reach you.",
  services: "What you do and what it costs. Customers book and the AI desk quotes from this list.",
  hours: "When customers can book, plus holidays.",
  area: "Where you work. The AI desk never confirms a job outside it.",
  photos: "Up to 30 photos of your work. The first is your cover.",
  credentials: "Gas Safe, NICEIC, insurance and DBS. We check each one before it shows.",
  booking: "Instant booking or request to book, cancellation policy and reminders.",
}

/** W-16 Dashboard profile: tabs Details, Services, Hours, Service area, Photos, Credentials, Booking settings (B-10 to B-17), saved per tab. */
function ProfilePage() {
  const sp = useSearchParams()
  const router = useRouter()
  const raw = sp.get("tab")
  const tab: ProfileTab = PROFILE_TABS.some((t) => t.value === raw) ? (raw as ProfileTab) : "details"
  const serviceId = tab === "services" ? sp.get("service") : null
  const servicesHref = profileHref("services")
  return (
    <DashPage
      id="W-16"
      title="Profile"
      sub={({ listing }) => listing.name}
      ownerOnly
    >
      {({ biz }) => (
        <>
        <LinkTabs label="Profile sections" tabs={PROFILE_TABS} value={tab} hrefFor={profileHref} />
        <div className="mt-4 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <p className="t-label font-normal text-slate">{TAB_INTRO[tab]}</p>
            <div className="card mt-3 max-w-3xl">
              {tab === "details" && <DetailsForm businessId={biz.id} />}
              {tab === "services" &&
                (serviceId ? (
                  <>
                    <Link href={servicesHref} scroll={false} className="ml-2 mt-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 t-label text-blue hover:bg-blue-tint">
                      <ArrowLeft className="size-4" aria-hidden /> All services
                    </Link>
                    <ServiceForm key={serviceId} businessId={biz.id} serviceId={serviceId} className="space-y-5 px-4 pt-2" onSaved={() => router.push(servicesHref, { scroll: false })} onDeleted={() => router.push(servicesHref, { scroll: false })} />
                  </>
                ) : (
                  <ServicesList businessId={biz.id} hrefFor={(id) => `${servicesHref}&service=${id}`} />
                ))}
              {tab === "hours" && <HoursForm businessId={biz.id} />}
              {tab === "area" && <AreaForm businessId={biz.id} />}
              {tab === "photos" && <PhotosForm businessId={biz.id} />}
              {tab === "credentials" && <CredentialsForm businessId={biz.id} />}
              {tab === "booking" && <BookingSettingsForm businessId={biz.id} />}
            </div>
          </div>
          <aside aria-label="Setup progress" className="min-w-0">
            <SetupChecklist businessId={biz.id} hrefFor={setupStepHref} />
          </aside>
        </div>
        </>
      )}
    </DashPage>
  )
}

export default withSuspense(ProfilePage)
