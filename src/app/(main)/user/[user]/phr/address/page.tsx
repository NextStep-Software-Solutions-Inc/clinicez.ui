import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import AddressFormForm from "./AddressForm"
import Suspend from "@components/Suspend"
import { AppRouterPageRouteOpts, getSession, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { redirect } from "next/navigation"
import { isUserOwner } from "@lib/protect-org"
import { getAddressesAction } from "@actions/address.action"
export const metadata: Metadata = {
  title: "Address | PHR",
  description: "Update your address to help you organization locate you."
}

async function AddressPage({params}: AppRouterPageRouteOpts) {

  const session = await getSession()
  const userId = decodeURI(params?.user as string)
  if(!session) return redirect("/api/auth/login")
  const owner = await isUserOwner(userId);
  const addresses = await getAddressesAction(session.user.sub)

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
        <AddressFormForm readOnly={!owner} addresses={addresses} userId={userId} />
      </Suspend>
    </div>
  )
}


export default withPageAuthRequired(AddressPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/user/${params?.user}/phr/address?${searchStr}`;
  }
})