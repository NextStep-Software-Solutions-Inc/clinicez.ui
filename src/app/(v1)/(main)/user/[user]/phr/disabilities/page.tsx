import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import { isUserOwner } from "@lib/org-utils"
import { DisabilityList } from "./DisabilityList"
import Suspend from "@components/Suspend"
import { AppRouterPageRouteOpts } from "@/types"

export const metadata: Metadata = {
  title: "Disabilities | PHR",
  description: "Update your disabilities information to help your organization track your health history."
}

export default async function DisabilitiesPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;

  const userId = decodeURI(params?.user as string)
  const ownerUser = await isUserOwner(userId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Disabilities</h3>
        <p className="text-sm text-muted-foreground">
          Enter your current or former disabilities information to help your organization track your health history.
        </p>
      </div>
      <Separator />
      <Suspend>
        <DisabilityList readOnly={!ownerUser} userId={userId}/>
      </Suspend>
    </div>
  )
}
