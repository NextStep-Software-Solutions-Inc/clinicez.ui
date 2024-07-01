import { getSession } from "@auth0/nextjs-auth0";
import Folder, { FolderProps } from "../../../../../../components/Folder";
import { getFoldersAction } from "@actions/folder.action";
import { format } from "date-fns";
import Each from "@components/utils/Each";
import { getUserOrganizationsAction } from "@actions/organization.action";

interface FilesFormProps {
  readOnly: boolean;
  userId: string;
}

export const FilesForm = async ({ readOnly = true, userId }:FilesFormProps) => {
  const session = await getSession();
  const folders = await getFoldersAction(userId);
  const userOrgs= await getUserOrganizationsAction({
    userId: session?.user.sub
  });
  const orgs = userOrgs.filter(uo => uo.UserRole.name.toLowerCase() === "admin" ).map(org => org.Organization.id);

  const mappedFolders: FolderProps["folder"][] = folders.filter(f => !readOnly  || f.Files.some(f => orgs.includes(f.FileType.FileTypeAttribute?.scopeOrgId ?? 0)) || f.FolderSetting?.isPublic).map(folder => {
    return {
      id: folder.id,
      name: folder.name,
      isPublic: folder.FolderSetting?.isPublic,
      description: format(folder.updatedAt, "PPp"),
      files: folder.Files.filter(f => !readOnly || orgs.includes(f.FileType.FileTypeAttribute?.scopeOrgId ?? 0) || f.FileSetting?.isPublic).map(file => ({
        id: file.id,
        name: file.name,
        description: `${(file.size / 1048576).toFixed(2)} MB - ${file.FileType.name}`,
        type: file.FileType.name,
        url: file.url,
        date: file.dateTaken,
        isPublic: file.FileSetting?.isPublic
      }))
    };
  });

  return (
    <div className="space-y-3">
      <Each
        of={mappedFolders}
        render={folder => <Folder readOnly={readOnly} folder={folder} />} />
    </div>
  );
};
