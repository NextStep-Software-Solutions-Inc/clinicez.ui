import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import Suspend from "@components/Suspend"
import { redirect } from "next/navigation"
import { isUserOwner } from "@lib/org-utils"
import { getCachedSession } from "@actions/session.action"
import { Addresses } from "./Addresses"
import { AppRouterPageRouteOpts } from "@/types"
export const metadata: Metadata = {
  title: "Address | PHR",
  description: "Update your address to help you organization locate you."
}

export default async function AddressPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;

  const session = await getCachedSession()
  const userId = decodeURI(params?.user as string)
  if (!session) return redirect("/sign-in")
  const owner = await isUserOwner(userId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Address</h3>
        <p className="text-sm text-muted-foreground">
          Update your address to help you organization locate you.
        </p>
      </div>
      <Separator />
      <Suspend>
        <Addresses readOnly={!owner} sessionUserId={session.user.sub} userId={userId} />
      </Suspend>
    </div>
  )
}