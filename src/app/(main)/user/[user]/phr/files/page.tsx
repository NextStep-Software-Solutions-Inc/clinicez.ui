import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import Suspend from "@components/Suspend"
import { isUserOwner } from "@lib/org-utils"
import ConditionalRender from "@components/utils/ConditionalRender"
import { FilesForm } from "./FilesForm"
import Folder from "../../../../../../components/CreateFolder"
import DownloadPHRForms from "../../../../../../components/phr/DownloadPHRForms"
import { getCachedSession } from "@actions/session.action"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Files | PHR",
  description: "These are the files you have uploaded to your PHR."
}

interface PageProps {
  params: Promise<{ user: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function PHRPage({ params, searchParams }: PageProps) {
  const session = await getCachedSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { user } = await params;
  const userId = decodeURI(user);
  const owner = await isUserOwner(userId);

  return (
    <div className="space-y-6">
      <div className="group/create-folder">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Files</h2>
            <p className="text-sm text-muted-foreground">
              These are the files you have uploaded to your PHR.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DownloadPHRForms userId={userId} />
            <ConditionalRender condition={owner}>
              <Folder />
            </ConditionalRender>
          </div>
        </div>
      </div>
      <Separator />
      <Suspend>
        <FilesForm userId={userId} readOnly={!owner} />
      </Suspend>
    </div>
  )
}

export default PHRPage;