import { getFoldersAction } from "@actions/folder.action";
import Each from "@components/utils/Each";
import Folder from "@components/Folder";
import dayjs from "@lib/day-utils";

interface EMRFilesProps {
  patientId: string;
  clinicUid: string;
}

export default async function EMRFiles({ patientId, clinicUid }: EMRFilesProps) {
  const folders = await getFoldersAction(patientId, clinicUid);

  return (
    <div className="space-y-3">
      <Each
        of={folders}
        fallback={<p className="text-muted-foreground">No files uploaded.</p>}
        render={(folder) => {
          // Map folder data to the format expected by Folder component
          const mappedFolder = {
            id: folder.id,
            name: folder.name,
            isPublic: folder.FolderSetting?.isPublic,
            description: `Last update: ${dayjs(folder.updatedAt).format("lll")}`,
            scopeClinicId: folder.FolderSetting?.scopeClinicId ?? 0,
            files: folder.Files.map((file) => {
              const validUntil = file.FileType.validUntil ?? 0;
              const valid =
                !!file.dateTaken &&
                dayjs().add(validUntil, "days").isAfter(file.dateTaken);
              return {
                id: file.id,
                name: file.name,
                isPublic: file.FileSetting?.isPublic,
                description: `${file.FileType?.name} - ${(
                  file.size /
                  1024 /
                  1024
                ).toFixed(2)} MB ${
                  valid ? "- Valid" : validUntil > 0 ? "- Expired" : ""
                }`,
                type: file.FileType?.name,
                url: file.url,
                date: file.dateTaken,
              };
            }),
          };
          return <Folder readOnly={true} folder={mappedFolder} />;
        }}
      />
    </div>
  );
}
