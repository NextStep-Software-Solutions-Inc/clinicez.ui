import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import Suspend from "@components/Suspend"
import { isUserOwner } from "@lib/org-utils"
import { getCachedSession } from "@actions/session.action"
import { EmergencyContacts } from "./EmergencyContacts"
import { AppRouterPageRouteOpts } from "@/types"

export const metadata: Metadata = {
  title: "Emergency Contact | PHR",
  description: "Update your emergency contact information to help you in case of emergency."
}

export default async function ContactInformationPage(props:AppRouterPageRouteOpts) {
  const params = await props.params;
  const session = await getCachedSession()
  if(!session) return redirect("/auth/login")
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