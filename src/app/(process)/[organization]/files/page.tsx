import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import Folder from "./components/Folder";
import Each from "@components/utils/Each";
import AlertBanner from "./components/AlertBanner";
import { Metadata } from "next";
import { getFilesAction } from "@actions/file.actions";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import CreateFolderModal from "./components/modals/CreateFolderModal";

export const metadata: Metadata = {
  title: "Files",
  description: "Manage and organize your files. All files are private by default and only accessible to you. You can share files with other users by sharing the link or allowing healthcare professionals to access the file.",
}

export default async function FilesPage({params}: AppRouterPageRouteOpts) {
  const organizationId = params?.organization as string
  const folders = await getFilesAction(organizationId)
  return (
    <>
      <div className="space-y-6">
        <div className="group/upload">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight"></h2>
            <CreateFolderModal />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage and organize your files. All files are private by default and only accessible to you. 
            You can share files with other users by sharing the link or allowing healthcare professionals to access the file.
          </p>
        </div>
          
        
        <Separator />
        <Suspend>
          <AlertBanner/>
        </Suspend>
        <Suspend>
          <Each
            of={folders}
            render={folder=> <Folder folder={folder} />}
          />
        </Suspend>
      </div>
    
    </>
  );
}
