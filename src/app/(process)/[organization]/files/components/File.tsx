import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { cn } from "@lib/utils";
import { DownloadIcon, FileText, ImageIcon } from "lucide-react";
import Link from "next/link";
import ConfirmDeleteFile from "./ConfirmDeleteFile";
import { format } from "date-fns";

interface FileProps {
    file: {
        id: string;
        name: string;
        description: string;
        type: string;
        url: string;
        date: Date;
    }
}


export default async function File({file}: FileProps) {
  const Icon = file.type === "document" ? FileText : ImageIcon;
  return (
    <div className={cn("-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground odd:bg-accent odd:text-accent-foreground group/item ")}>
      <Icon className="mt-px h-5 w-5 text-primary"/>
      <div className="flex w-full">
        <div className="space-y-1">
          <Link href={file.url} target="_blank" rel="noreferrer">
            <p className="text-sm font-medium leading-none"><span className="italic hover:underline">{file.name}</span> - <span>{format(file.date, "Ppp")}</span></p>
          </Link>
          <p className="text-sm text-muted-foreground">{file.description}</p>
        </div>
        <div className="flex items-center ml-auto gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={file.url} download className="invisible group-hover/item:visible">
                <DownloadIcon className="h-4 w-4  hover:scale-125 transition-all"/>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">Download</TooltipContent>
          </Tooltip>
          <ConfirmDeleteFile fileId={file.id}/>
        </div>
      </div>
    </div>
  )
}
