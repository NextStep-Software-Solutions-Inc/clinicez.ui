import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import Suspend from "@components/Suspend"
import { isUserOwner } from "@lib/org-utils"
import ConditionalRender from "@components/utils/ConditionalRender"
import { FilesForm } from "./FilesForm"
import Folder from "../../../../../../components/CreateFolder"
import { getCachedSession } from "@actions/session.action"
import { redirect } from "next/navigation"

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
    redirect("/api/auth/login");
  }

  const { user } = await params;
  const userId = decodeURI(user);
  const owner = await isUserOwner(userId);

  return (
    <div className="space-y-6">
      <div className="group/create-folder">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight">Files</h2>
          <ConditionalRender condition={owner}>
            <Folder />
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

export default PHRPage;