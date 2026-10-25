import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { SignInFlow } from "@/components/web/sign-in-flow"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.signIn.metaTitle, description: pages.signIn.body, path: "/sign-in", noindex: true })

/** W-12: sign in (mock) for business owners who need billing. */
export default function SignInPage() {
  return (
    <WebPage className="bg-sky">
      <SignInFlow copy={pages.signIn} />
    </WebPage>
  )
}
