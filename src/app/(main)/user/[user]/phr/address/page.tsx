import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import AddressFormForm from "./AddressForm"
import Suspend from "@components/Suspend"
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { redirect } from "next/navigation"
import { isUserOwner } from "@lib/protect-org"
import { getAddressesAction } from "@actions/address.action"
import { getCachedSession } from "@actions/session.action"
export const metadata: Metadata = {
  title: "Address | PHR",
  description: "Update your address to help you organization locate you."
}

async function AddressPage({params}: AppRouterPageRouteOpts) {

  const session = await getCachedSession()
  const userId = decodeURI(params?.user as string)
  if(!session) return redirect("/api/auth/login")
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
        <Addresses readOnly={!owner} sessionUserId={session.user.sub} userId={userId}  />
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

interface AddressFormProps {
  sessionUserId: string
  readOnly?: boolean;
  userId: string;
}

export const Addresses = async ({ userId, ...props }: AddressFormProps) => {
  
  const addresses = await getAddressesAction(userId)

  return (
    <AddressFormForm {...props} addresses={addresses}  />
  )
}