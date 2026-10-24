"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Camera } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { Field, TextInput } from "@/components/answerd/Fields"
import { PersonAvatar } from "@/components/answerd/Media"
import { BottomSheet } from "@/components/answerd/Sheet"
import { OTPInput } from "@/components/answerd/OTPInput"
import { useStore } from "@/lib/store"
import { normaliseUkMobile } from "@/lib/format"
import { toast } from "@/lib/toast"

/** C-40: changing the phone number needs a new code. */
export default function EditProfile() {
  const router = useRouter()
  const s = useStore()
  const user = s.users.find((u) => u.id === s.session.userId)
  const [first, setFirst] = React.useState(user?.firstName ?? "")
  const [last, setLast] = React.useState(user?.lastName ?? "")
  const [email, setEmail] = React.useState(user?.email ?? "")
  const [phone, setPhone] = React.useState(user?.phone ?? "")
  const [errors, setErrors] = React.useState<{ first?: string; email?: string; phone?: string }>({})
  const [verify, setVerify] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [codeErr, setCodeErr] = React.useState(false)
  React.useEffect(() => {
    if (!user) router.replace("/app/account")
  }, [user, router])
  if (!user) return null

  const save = (newPhone?: string) => {
    s.updateProfile({ firstName: first.trim(), lastName: last.trim(), email: email.trim() || undefined, ...(newPhone ? { phone: newPhone } : {}) })
    toast("Profile saved")
    router.push("/app/account")
  }

  return (
    <AppScreen id="C-40" bg="white" header={<TopBar title="Edit profile" back="/app/account" />}>
      <form
        className="space-y-5 px-4 py-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          const errs: typeof errors = {}
          if (!first.trim()) errs.first = "Enter your first name"
          if (email && !/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter an email like name@example.com"
          const p = normaliseUkMobile(phone)
          if (!p) errs.phone = "Enter a UK mobile number"
          setErrors(errs)
          if (Object.keys(errs).length) return
          if (p !== user.phone) {
            setVerify(true)
            return
          }
          save()
        }}
      >
        <div className="flex flex-col items-center">
          <span className="relative">
            <PersonAvatar name={`${first || "?"} ${last}`} size={88} tone="navy" />
            <button type="button" onClick={() => toast("Photo picker opens here (prototype)")} aria-label="Change photo" className="absolute -bottom-1 -right-1 inline-flex size-10 items-center justify-center rounded-full border-2 border-white bg-blue text-white">
              <Camera className="size-4" />
            </button>
          </span>
        </div>
        <Field label="First name" htmlFor="first" error={errors.first}>
          <TextInput id="first" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" aria-invalid={!!errors.first} />
        </Field>
        <Field label="Last name" htmlFor="last" optional>
          <TextInput id="last" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
        </Field>
        <Field label="Email" htmlFor="email" optional hint="For booking receipts" error={errors.email}>
          <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
        </Field>
        <Field label="Mobile number" htmlFor="phone" hint="Changing it needs a new code" error={errors.phone}>
          <TextInput id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="tnum" aria-invalid={!!errors.phone} />
        </Field>
        <Button block type="submit">
          Save
        </Button>
      </form>
      <BottomSheet open={verify} onClose={() => setVerify(false)} title="Confirm your new number">
        <p className="t-body text-slate">We sent a 6-digit code to {normaliseUkMobile(phone)}.</p>
        <div className="mt-4">
          <OTPInput
            value={code}
            onChange={(v) => (setCode(v), setCodeErr(false))}
            error={codeErr}
            onComplete={(v) => {
              if (v === "000000") {
                setCodeErr(true)
                setCode("")
                return
              }
              setVerify(false)
              save(normaliseUkMobile(phone)!)
            }}
          />
        </div>
        {codeErr && (
          <p role="alert" className="mt-2 t-caption text-red">
            That code didn&apos;t match
          </p>
        )}
      </BottomSheet>
    </AppScreen>
  )
}
