import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import Suspend from "@components/Suspend"
import { isUserOwner } from "@lib/org-utils"
import ConditionalRender from "@components/utils/ConditionalRender"
import { FilesForm } from "./FilesForm"
import { revalidatePath } from "@/actions/cache.action"
import Folder from "../../../../../../components/CreateFolder"
import { AppRouterPageRouteOpts } from "@/types"

export const metadata: Metadata = {
  title: "Files | PHR",
  description: "These are the files you have uploaded to your PHR."
}

export default async function PHRPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;
  const userId = decodeURI(params?.user as string)
  const owner = await isUserOwner(userId);

  return (
    <div className="space-y-6">
      <div className="group/create-folder">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight">Files</h2>
          <ConditionalRender condition={owner}>
            <Folder/>
          </ConditionalRender>
        </div>
        <p className="text-sm text-muted-foreground">
            These are the files you have uploaded to your PHR.
        </p>
      </div>
      <Separator />
      <Suspend>
        <FilesForm userId={userId} readOnly={!owner} />
      </Suspend>
      
    </div>
  )
}