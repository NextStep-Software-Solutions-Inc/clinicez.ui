import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn } from "@lib/utils";
import { DownloadIcon, ImageIcon, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);

export interface PrescriptionItemProps {
  prescription: {
    name: string;
    medicationsCount: number;
    createdAt: Date;
    patient: {
      userId: string;
      name: string;
    };
  };
}
export default async function PrescriptionItem({
  prescription
}: PrescriptionItemProps) {
  const Icon = ImageIcon;
  return (
    <div
      className={cn(
        "-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground odd:bg-accent odd:text-accent-foreground group/item "
      )}
    >
      <Icon className="mt-px h-5 w-5 text-primary" />
      <div className="flex w-full">
        <div className="space-y-1">
          <Link
            href={"/"}
            target="_blank"
            rel="noreferrer"
          >
            <p className="text-sm font-medium leading-none">
              <span className="italic hover:underline">
                {prescription.name} - {prescription.patient.name}
              </span>
            </p>
          </Link>
          <p className="text-sm text-muted-foreground">
            {prescription.createdAt &&
              dayjs(prescription.createdAt).format("lll")}
          </p>
        </div>
        <div className="flex items-center ml-auto gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={"/"}
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={"/"}
                  download
                  className="invisible group-hover/item:visible"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <Pencil className="h-4 w-4  hover:scale-125 transition-all" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">Modify</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
