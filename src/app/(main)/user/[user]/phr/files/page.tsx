import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"
import Suspend from "@components/Suspend"
import { isUserOwner } from "@lib/protect-org"
import CreateFolderModal from "../../../../../(process)/[organization]/files/components/modals/CreateFolderModal"
import ConditionalRender from "@components/utils/ConditionalRender"
import { FilesForm } from "./FilesForm"

export const metadata: Metadata = {
  title: "Files | PHR",
  description: "These are the files you have uploaded to your PHR."
}

async function PHRPage({ params, searchParams }: AppRouterPageRouteOpts) {
  const userId = decodeURI(params?.user as string) 
  const owner = await isUserOwner(userId);
    
  return (
    <div className="space-y-6">
      <div className="group/create-folder">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight">Files</h2>
          <ConditionalRender condition={owner}>
            <CreateFolderModal />
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

export default withPageAuthRequired(PHRPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/user/${params?.organization}/phr?${searchStr}`;
  }
})