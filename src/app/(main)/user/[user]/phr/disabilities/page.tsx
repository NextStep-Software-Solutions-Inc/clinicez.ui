import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { isUserOwner } from "@lib/protect-org"
import { DisabilityList } from "./DisabilityList"
import { IllnessList } from "./IllnessList"
import Suspend from "@components/Suspend"

export const metadata: Metadata = {
  title: "Disabilities | PHR",
  description: "Update your disabilities and illnesses information to help your organization track your health history."
}

async function DisabilitiesPage({params}: AppRouterPageRouteOpts) {

  const userId = decodeURI(params?.user as string)
  const ownerUser = await isUserOwner(userId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Disabilities and Illnesses</h3>
        <p className="text-sm text-muted-foreground">
          Enter your current or former disabilities and illnesses information to help your organization track your health history.
        </p>
      </div>
      <Separator />
      <Suspend>
        <DisabilityList readOnly={!ownerUser} userId={userId}/>
      </Suspend>
      <Suspend>
        <IllnessList userId={userId} readOnly={!ownerUser}/>
      </Suspend>
    </div>
  )
}
export default withPageAuthRequired(DisabilitiesPage)