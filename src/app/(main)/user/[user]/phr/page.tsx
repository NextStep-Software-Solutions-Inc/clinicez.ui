import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import Suspend from "@components/Suspend"
import { isUserOwner } from "@lib/org-utils"
import { PictureWrapper } from "./PictureWrapper"
import { PHR } from "./PHR"
import { AppRouterPageRouteOpts } from "@/types"

export const metadata: Metadata = {
  title: "Basic Information | PHR",
  description: "Update your basic information to help you identify your account in your organization."
}

export default async function PHRPage({ params, searchParams }: AppRouterPageRouteOpts) {
  const resolvedParams = await params
  const userId = decodeURI(resolvedParams?.user as string)
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