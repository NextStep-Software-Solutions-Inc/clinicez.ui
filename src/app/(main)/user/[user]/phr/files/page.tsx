import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"
import Suspend from "@components/Suspend"
import { isUserOwner } from "@lib/org-utils"
import ConditionalRender from "@components/utils/ConditionalRender"
import { FilesForm } from "./FilesForm"
import CreateFolderModal from "@components/files/modals/CreateFolderModal"
import { revalidatePath } from "@/actions/cache.action"

export const metadata: Metadata = {
  title: "Files | PHR",
  description: "These are the files you have uploaded to your PHR."
}

function revalidate() {
  revalidatePath(`/user/[user]/phr/files/page`, "page");
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
            <CreateFolderModal onCreated={revalidate} />
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
    return `/user/${params?.userId}/phr?${searchStr}`;
  }
})