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
import { toast } from "sonner";
import ActionButton from "./ActionButton";
import { promiseWrapper } from "@/lib/with-error-handling";
import { getPrescriptionAction } from "@/actions/medications/prescription.action";
dayjs.extend(localizedFormat);

export interface PrescriptionItemProps {
  onUpdated?: () => void;
  prescription: {
    id: number;
    name: string;
    medicationDrugs: number;
    completedAt: Date | null;
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
            href={`prescription-builder/${prescription.id}`}
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
              {!!prescription.completedAt && (
                <Badge variant="default">
                  Completed
                </Badge>
              )}
            </div>
          </Link>
          <p className="text-sm text-muted-foreground">
            {prescription.createdAt &&
              dayjs(prescription.createdAt).format("lll")}
          </p>
        </div>
        <div className="flex items-center ml-auto gap-1">
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

  const handleDownload = async () => {
    toast.promise(promiseWrapper(getPrescriptionAction)(prescription.id), {
      loading: "Downloading prescription...",
      success: (res) => {
        handlePrintHtml(res.data?.DocumentTemplate.htmlContent);
        return res.message;
      },
      error: "Failed to download prescription"
    })
  }

  const handlePrintHtml = async (html: string = "") => {

    // print html content
    const printWindow = window.open("", "_blank");
    printWindow?.document.write(html);
    printWindow?.document.close();
    printWindow?.print();
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <form action={handleDownload}>
            <ActionButton
              variant="ghost"
              size="icon"
              className="invisible group-hover/item:visible"
            >
              <DownloadIcon className="h-4 w-4  hover:scale-125 transition-all" />
            </ActionButton>
          </form>
        </TooltipTrigger>
        <TooltipContent side="top">Download</TooltipContent>
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