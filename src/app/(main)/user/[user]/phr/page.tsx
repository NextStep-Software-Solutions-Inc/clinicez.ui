import { Separator } from "@components/ui/separator"
import { PersonalInformationForm } from "./PersonalInformationForm"
import { Metadata } from "next"
import { AppRouterPageRouteOpts, getSession, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { getUserAction } from "@actions/user.action"

export const metadata: Metadata = {
  title: "Basic Information | PHR",
  description: "Update your basic information to help you identify your account in your organization."
}

async function PHRPage({ params, searchParams }: AppRouterPageRouteOpts) {
  const userId = decodeURI(params?.user as string) 
  if(!userId) throw new Error("User ID is required to view this page.")

  const user = await getUserAction(userId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          Update your basic information to help you identify your account in your organization.
        </p>
      </div>
      <Separator />
      <PersonalInformationForm  user={user} />
    </div>
  )
}

export default withPageAuthRequired(PHRPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/user/${params?.organization}/phr?${searchStr}`;
  }
})