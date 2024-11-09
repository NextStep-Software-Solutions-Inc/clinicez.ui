import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn } from "@lib/utils";
import { DownloadIcon, Eye, Pill, Trash } from "lucide-react";
import Link from "next/link";
import { Button } from "@components/ui/button";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Badge } from "@components/ui/badge";
import UpdatePrescriptionModal from "./prescription/modals/UpdatePrescriptionModal";
dayjs.extend(localizedFormat);

export interface PrescriptionItemProps {
  onUpdated?: () => void;
  prescription: {
    id: number;
    name: string;
    medicationDrugs: number;
    createdAt: Date;
    patient: {
      userId: string;
      name: string;
    };
  };
}
export default function PrescriptionItem({prescription, onUpdated}: PrescriptionItemProps) {
  const Icon = Pill;
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
            <div className="text-sm font-medium leading-none space-x-2">
              <span className="">
                {prescription.name || `Prescription #${prescription.id}`} - {prescription.patient.name}
              </span>
              <Badge variant="destructive">
                Medication Drugs: {prescription.medicationDrugs}
              </Badge>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground">
            {prescription.createdAt &&
              dayjs(prescription.createdAt).format("lll")}
          </p>
        </div>
        <div className="flex items-center ml-auto gap-1">
          <ViewPrescriptionAction prescription={prescription}/>
          <DownloadPrescriptionAction prescription={prescription}/>
          <ModifyPrescriptionAction prescription={prescription} onUpdated={onUpdated}/>
          <DeletePrescriptionAction prescription={prescription}/>
        </div>
      </div>
    </div>
  );
}

const ModifyPrescriptionAction = ({prescription, onUpdated}: {prescription: PrescriptionItemProps["prescription"], onUpdated?: () => void}) => {
  return (
    <UpdatePrescriptionModal onUpdated={onUpdated} prescription={prescription}/>
  )
}

const DownloadPrescriptionAction = ({prescription}: {prescription: PrescriptionItemProps["prescription"]}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={"#"}
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
  )
}

const ViewPrescriptionAction = ({prescription}: {prescription: PrescriptionItemProps["prescription"]}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`prescription-builder/${prescription.id}`}
            download
            className="invisible group-hover/item:visible"
          >
            <Button
              variant="ghost"
              size="icon"
            >
              <Eye className="h-4 w-4  hover:scale-125 transition-all" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top">View</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const DeletePrescriptionAction = ({prescription}: {prescription: PrescriptionItemProps["prescription"]}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="invisible group-hover/item:visible text-destructive hover:text-destructive/90"
          >
            <Trash className="h-4 w-4 hover:scale-125 transition-all" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Delete</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}