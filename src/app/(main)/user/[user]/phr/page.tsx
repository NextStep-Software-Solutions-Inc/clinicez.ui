import { Separator } from "@components/ui/separator"
import { PersonalInformationForm } from "./PersonalInformationForm"
import { Metadata } from "next"
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { getUserAction } from "@actions/user.action"
import Suspend from "@components/Suspend"
import { Picture } from "./Picture"
import { isUserOwner } from "@lib/protect-org"

export const metadata: Metadata = {
  title: "Basic Information | PHR",
  description: "Update your basic information to help you identify your account in your organization."
}

async function PHRPage({ params, searchParams }: AppRouterPageRouteOpts) {
  const userId = decodeURI(params?.user as string) 
  if(!userId) throw new Error("User ID is required to view this page.")
  const userOwner = await isUserOwner(userId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          Update your basic information to help you identify your account in your organization.
        </p>
      </div>
      <Separator />
      <Suspend>
        <PictureWrapper userId={userId} readOnly={!userOwner}/>
      </Suspend>
      <Suspend>
        <PHR userId={userId} readOnly={!userOwner} />
      </Suspend>
    </div>
  )
}

export default withPageAuthRequired(PHRPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/user/${params?.organization}/phr?${searchStr}`;
  }
})


interface PHRProps {
  userId: string
  readOnly?: boolean;
}

export const PHR = async ({userId, readOnly = true}:PHRProps) => {
  const user = await getUserAction(userId);
  return (
    <PersonalInformationForm user={user} readOnly={readOnly} />
  )
}

export const PictureWrapper = async ({userId, readOnly}:PHRProps) => {
  const user = await getUserAction(userId);
  return (
    <Picture user={user} readOnly={readOnly} />
  )
}
