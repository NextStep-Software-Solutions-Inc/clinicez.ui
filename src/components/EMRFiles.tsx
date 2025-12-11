"use client";

import Each from "@components/utils/Each";
import dayjs from "@lib/day-utils";
import { useFolders } from "@hooks/useFolder";
import Link from "next/link";
import { DownloadIcon, FileText, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@lib/utils";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";

interface EMRFilesProps {
  patientId: string;
  clinicUid: string;
}

export default function EMRFiles({ patientId, clinicUid }: EMRFilesProps) {
  // Pass clinicUid to get clinic-scoped folders
  const { data: foldersData, isLoading, error } = useFolders({ userId: patientId, clinicUid });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading files...</p>;
  }

  if (error) {
    return <p className="text-muted-foreground">Failed to load files.</p>;
  }

  const folders = foldersData?.data ?? [];
  
  // Flatten all files from all folders into a single list
  // Filter to only show PUBLIC files (isPublic === true)
  const allFiles = folders.flatMap((folder) => 
    folder.Files
      .filter((file) => file.FileSetting?.isPublic === true)  // Only show public files
      .map((file) => {
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
      })
  );

  return (
    <div className="space-y-1">
      <Each
        of={allFiles}
        fallback={<p className="text-muted-foreground">No files uploaded.</p>}
        render={(file) => {
          const Icon = file.type === "document" ? FileText : ImageIcon;
          const fileRowClasses = cn(
            "-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all",
            "hover:bg-accent hover:text-accent-foreground",
            "odd:bg-accent odd:text-accent-foreground group/item"
          );
          
          return (
            <div
              key={file.id}
              className={fileRowClasses}
            >
              <Icon className="mt-px h-5 w-5 text-primary" />
              <div className="flex w-full">
                <div className="space-y-1">
                  <Link href={file.url} target="_blank" rel="noreferrer" >
                    <p className="text-sm font-medium leading-none">
                      <span className="italic hover:underline">{file.name}</span> -{" "}
                      <span>{file.date && format(file.date, "PP")}</span>
                    </p>
                  </Link>
                  <p className="text-sm text-muted-foreground">{file.description}</p>
                </div>
                <div className="flex items-center ml-auto gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={file.url}
                          download
                          className="opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Download file"
                          >
                            <DownloadIcon className="h-4 w-4 hover:scale-125 transition-all" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top">Download</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
