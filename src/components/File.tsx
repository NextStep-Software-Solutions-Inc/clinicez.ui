import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn } from "@lib/utils";
import { DownloadIcon, FileText, ImageIcon, Settings } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import ConditionalRender from "./utils/ConditionalRender";
import FileSettingSheet from "./FileSettingSheet";
import { Button } from "./ui/button";
import ConfirmDeleteFile from "./files/ConfirmDeleteFile";

export interface FileProps {
  readOnly?: boolean;
  file: {
    id: number;
    name: string;
    isPublic?: boolean;
    description: string;
    type: string;
    url: string;
    date: Date | null;
  };
}

export default async function File({ file, readOnly = true }: FileProps) {
  const Icon = file.type === "document" ? FileText : ImageIcon;
  return (
    <div
      className={cn(
        "-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground odd:bg-accent odd:text-accent-foreground group/item "
      )}
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
                  className="invisible group-hover/item:visible"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <DownloadIcon className="h-4 w-4  hover:scale-125 transition-all" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ConditionalRender condition={!readOnly}>
            <ConfirmDeleteFile fileId={file.id} />
          </ConditionalRender>
          <ConditionalRender condition={!readOnly}>
            <FileSettingSheet
              record={{
                id: file.id,
                subject: file.name,
                settings: {
                  isPublic: file.isPublic ?? false
                }
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="group/settings invisible group-hover/item:visible"
              >
                <Settings className="h-4 w-4 group-hover/settings:rotate-90 group-hover/settings:scale-125 transition-all" />
              </Button>
            </FileSettingSheet>
          </ConditionalRender>
        </div>
      </div>
    </div>
  );
}
