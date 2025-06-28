import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import Suspend from "@components/Suspend"
import { AllergyList } from "./AllergyList"
import { isUserOwner } from "@lib/org-utils"
import { AppRouterPageRouteOpts } from "@/types"

export const metadata: Metadata = {
  title: "Allergies | PHR",
  description: "Update your allergy information for your healthcare providers to better understand your health."
}

export default async function AllergiesPage({ params }: AppRouterPageRouteOpts) {
  const userId = decodeURI(params?.user as string)
  const ownerUser = await isUserOwner(userId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Allergies</h3>
        <p className="text-sm text-muted-foreground">
          Enter your allergy record for your healthcare providers to better understand your health history.
        </p>
      </div>
      <Separator />
      <Suspend>
        <AllergyList readOnly={!ownerUser} userId={userId} />
      </Suspend>
    </div>
  )
}