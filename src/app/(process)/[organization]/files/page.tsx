import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import CreateFolderModal from "@components/files/modals/CreateFolderModal";
// import AlertBanner from "@components/files/AlertBanner";
import Each from "@components/utils/Each";
import Folder from "@components/Folder";
import { getFoldersAction } from "@actions/folder.action";
import { getCachedSession } from "@actions/session.action";
import dayjs from "dayjs";

export const metadata: Metadata = {
  title: "Files",
  description: "Manage and organize your files. All files are private by default and only accessible to you. You can share files with other users by sharing the link or allowing healthcare professionals to access the file.",
}

export default async function FilesPage({params}: AppRouterPageRouteOpts) {
  const orgUid = params?.organization as string
  const session = await getCachedSession()
  const folders = await getFoldersAction(session?.user.sub, orgUid)
  return (
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight">Files</h2>
            <CreateFolderModal orgUid={orgUid} />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage and organize your files. All files are private by default and only accessible to you. You can share files with other users by sharing the link or allowing healthcare professionals to access the file.
          </p>
        </div>
        
        <Separator />
        {/* <Suspend>
          <AlertBanner/>
        </Suspend> */}
        <Suspend>
          <Each
            of={folders}
            render={folder=> {
              
              const mappedFolder = {
                id: folder.id,
                name: folder.name,
                isPublic: folder.FolderSetting?.isPublic,
                description: `Last update: ${dayjs(folder.updatedAt).format("lll")}`,
                scopeClinicId: folder.FolderSetting?.scopeClinicId ?? 0,
                files: folder.Files.map(file => {
                  const validUntil = file.FileType.FileTypeAttribute?.validityDays ?? 0;
                  const valid = !!file.dateTaken && dayjs().add(validUntil, "days").isAfter(file.dateTaken);
                  return {
                    id: file.id,
                    name: file.name,
                    isPublic: file.FileSetting?.isPublic,
                    description: `${file.FileType?.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB ${valid ? "- Valid" : validUntil > 0 ? "- Expired" : ""}`,
                    type: file.FileType?.name,
                    url: file.url,
                    date: file.dateTaken
                  }
                })
              }
              return <Folder readOnly={false} folder={mappedFolder}/>
            }}
          />
        </Suspend>
      </div>
    
    </>
  );
}
