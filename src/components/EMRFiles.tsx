"use client";

import Each from "@components/utils/Each";
import Folder from "@components/Folder";
import dayjs from "@lib/day-utils";
import { useFolders } from "@hooks/useFolder";

interface EMRFilesProps {
  patientId: string;
  clinicUid: string;
}

export default function EMRFiles({ patientId, clinicUid }: EMRFilesProps) {
  const { data: foldersData, isLoading, error } = useFolders({ userId: patientId, clinicUid });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading files...</p>;
  }

  if (error) {
    return <p className="text-muted-foreground">Failed to load files.</p>;
  }

  const folders = foldersData?.data ?? [];

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
              const valid = !!file.dateTaken && dayjs().add(validUntil, "days").isAfter(file.dateTaken);
              return {
                id: file.id,
                name: file.name,
                isPublic: file.FileSetting?.isPublic,
                description: `${file.FileType?.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB ${
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
