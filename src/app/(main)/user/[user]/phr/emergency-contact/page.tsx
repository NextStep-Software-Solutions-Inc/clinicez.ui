import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { redirect } from "next/navigation"
import Suspend from "@components/Suspend"
import { isUserOwner } from "@lib/protect-org"
import { getCachedSession } from "@actions/session.action"
import { EmergencyContacts } from "./EmergencyContacts"

export const metadata: Metadata = {
  title: "Emergency Contact | PHR",
  description: "Update your emergency contact information to help you in case of emergency."
}

async function ContactInformationPage({params}:AppRouterPageRouteOpts) {
  const session = await getCachedSession()
  if(!session) return redirect("/api/auth/login")
  const userId = decodeURI(params?.user as string)
  const owner = await isUserOwner(userId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Emergency Contact</h3>
        <p className="text-sm text-muted-foreground">
          Update your emergency contact information to help you in case of emergency.
        </p>
      </div>
      <Separator />
      <Suspend>
        <EmergencyContacts sessionUserId={session.user.sub} readOnly={!owner} userId={userId}/>
      </Suspend>
    </div>
  )
}

export default withPageAuthRequired(ContactInformationPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/user/${params?.user}/phr.emergency-contact?${searchStr}`;
  }
});