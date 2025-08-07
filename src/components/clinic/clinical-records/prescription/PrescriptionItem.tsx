import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn, calculateAge } from "@/lib/utils";
import { Archive, DownloadIcon, Edit, Pill, User } from "lucide-react";
import dayjs from "@/lib/day-utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ActionButton from "@/components/ActionButton";
import { promiseWrapper } from "@/lib/with-error-handling";
import { GetPrescriptions, updatePrescriptionAction } from "@/actions/clinics/clinical-record/prescription.action";
import { formatPatientAddress } from "@/lib/utils/format-patient-address";
import DownloadPrescriptionAction from "./DownloadPrescriptionAction";
import EditPrescriptionModal from "./modals/EditPrescriptionModal";

export interface PrescriptionItemProps {
  onUpdated?: () => void;
  prescription: NonNullable<GetPrescriptions["data"]>[number];
  hpIds: number[];
}

export default function PrescriptionItem({ prescription, onUpdated, hpIds }: PrescriptionItemProps) {
  const patient = prescription.ClinicPatient?.Patient;
  const medicineCount = prescription.Medicines?.length || 0;
  const [editModalOpen, setEditModalOpen] = React.useState(false);

  const itemClassName = cn(
    "-mx-2 flex items-center space-x-4 rounded-md p-2",
    "transition-all group/item",
    "hover:bg-accent hover:text-accent-foreground",
    "odd:bg-muted odd:text-accent-foreground"
  );

  const handleArchive = async () => {
    toast.promise(
      promiseWrapper(updatePrescriptionAction)({
        id: prescription.id,
        isArchived: !prescription.isArchived,
        hpIds,
      }),
      {
        loading: prescription.isArchived ? "Unarchiving prescription..." : "Archiving prescription...",
        success: (data) => {
          onUpdated?.();
          return data.message || `Prescription ${prescription.isArchived ? 'unarchived' : 'archived'} successfully!`;
        },
        error: (error) => {
          return error as string;
        },
      }
    );
  };

  return (
    <div className={itemClassName}>
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
        <Pill className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold leading-tight">
              {patient?.firstName ?? "Unknown"} {patient?.lastName ?? ""}
            </span>
            {prescription.isArchived && (
              <Badge variant="destructive" className="text-xs">
                Archived
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ID: {prescription.serialNumber || prescription.id}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate line-clamp-1">
            {formatPatientAddress(patient)}
          </span>
          <div className="flex items-center justify-center w-12 text-center text-xs text-muted-foreground font-medium">
            <span className="flex items-center justify-center w-full h-full">
              {patient?.dob ? calculateAge(patient.dob) : "-"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center min-w-[120px]">
              <Badge variant="secondary" className="text-xs">
                {medicineCount} {medicineCount === 1 ? 'Medicine' : 'Medicines'}
              </Badge>
            </div>
            <div className="flex flex-col items-end min-w-[160px]">
              <span className="text-xs text-muted-foreground">
                {prescription.createdAt && dayjs(prescription.createdAt).format("MM/D/YYYY | h:mm A")}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DownloadPrescriptionAction prescription={{ id: prescription.id }} onUpdated={onUpdated}>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  className="invisible group-hover/item:visible text-primary hover:text-primary/90"
                >
                  <DownloadIcon className="h-4 w-4 hover:scale-125 transition-all" />
                </ActionButton>
              </DownloadPrescriptionAction>
            </TooltipTrigger>
            <TooltipContent side="top">Download</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton
                variant="ghost"
                size="icon"
                className="invisible group-hover/item:visible text-blue-500 hover:text-blue-600"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="h-4 w-4 hover:scale-125 transition-all" />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent side="top">Edit</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton
                variant="ghost"
                size="icon"
                className="invisible group-hover/item:visible text-destructive hover:text-destructive/90"
                onClick={handleArchive}
              >
                <Archive className="h-4 w-4 hover:scale-125 transition-all" />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent side="top">
              {prescription.isArchived ? "Unarchive" : "Archive"} Prescription
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <EditPrescriptionModal
          prescription={prescription}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUpdated={onUpdated}
          hpIds={hpIds}
        />
      </div>
    </div>
  );
}
