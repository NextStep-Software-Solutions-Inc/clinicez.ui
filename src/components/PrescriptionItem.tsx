import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn } from "@lib/utils";
import { Archive, DownloadIcon, File, Pill, User } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Badge } from "@components/ui/badge";
import UpdatePrescriptionModal from "./prescription/modals/UpdatePrescriptionModal";
import { toast } from "sonner";
import ActionButton from "./ActionButton";
import { promiseWrapper } from "@/lib/with-error-handling";
import { GetPrescriptions, archivePrescriptionAction, getPrescriptionAction } from "@/actions/medications/prescription.action";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";
dayjs.extend(localizedFormat);

export interface PrescriptionItemProps {
  onUpdated?: () => void;
  prescription: NonNullable<GetPrescriptions["data"]>[number];
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
      <div className="flex w-full justify-between">
        <div className="space-y-1 flex-1">
          <Link
            href={`prescription-builder/${prescription.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <div className="text-sm font-medium leading-none space-x-2">
              <span className="">
                {prescription.name || `Prescription #${prescription.id}`} - {prescription.Medication.Patient.firstName}
              </span>
              <Badge variant="destructive">
                Medication Drugs: {prescription.Medication._count.MedicationDrugs}
              </Badge>
              {!!prescription.Medication.completedAt && (
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
        <div className="flex flex-1 flex-col text-sm">
          <p className="flex gap-1"><User size={16}/>{prescription.HealthcareProvider.HPProfile?.title} {prescription.HealthcareProvider.HPProfile?.name} {prescription.HealthcareProvider.HPProfile?.suffix}</p>
          <p className="flex gap-1"><File size={16}/>{prescription.DocumentTemplate.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <DownloadPrescriptionAction prescription={prescription}/>
          <ModifyPrescriptionAction prescription={prescription} onUpdated={onUpdated}/>
          <ARchivePrescriptionAction prescription={prescription}/>
        </div>
      </div>
    </div>
  );
}

const ModifyPrescriptionAction = ({prescription, onUpdated}: {prescription: PrescriptionItemProps["prescription"], onUpdated?: () => void}) => {
  return (
    <UpdatePrescriptionModal onUpdated={onUpdated} prescription={{
      id: prescription.id,
      name: prescription.name ?? "",
    }}/>
  )
}

const DownloadPrescriptionAction = ({prescription}: {prescription: PrescriptionItemProps["prescription"]}) => {

  const handleDownload = async () => {
    toast.promise(promiseWrapper(getPrescriptionAction)(prescription.id), {
      loading: "Downloading prescription...",
      success: (res) => {
        handlePrintHtmlToPDF(res.data?.DocumentTemplate.htmlContent);
        return res.message;
      },
      error: "Failed to download prescription"
    })
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

const ARchivePrescriptionAction = ({prescription}: {prescription: PrescriptionItemProps["prescription"]}) => {
  
  const handleArchivePrescription = async () => {
    toast.promise(promiseWrapper(archivePrescriptionAction)(prescription.id), {
      loading: "Deleting prescription...",
      success: (res) => {
        return res.message;
      },
      error: error => error
    })
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <form action={handleArchivePrescription}>
            <ActionButton
              variant="ghost"
              size="icon"
              className="invisible group-hover/item:visible text-destructive hover:text-destructive/90"
            >
              <Archive className="h-4 w-4 hover:scale-125 transition-all" />
            </ActionButton>
          </form>
        </TooltipTrigger>
        <TooltipContent side="top">Archive</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}