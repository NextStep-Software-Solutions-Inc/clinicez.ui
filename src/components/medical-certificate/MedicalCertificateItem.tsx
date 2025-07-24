
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn, calculateAge } from "@lib/utils";
import { Edit, DownloadIcon, Trash2, User } from "lucide-react";
import dayjs from "@lib/day-utils";
import { Badge } from "@components/ui/badge";
import ActionButton from "../ActionButton";
import DownloadMedicalCertificateAction from "./DownloadMedicalCertificateAction";
import EditMedicalCertificateModal from "./EditMedicalCertificateModal";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { deleteMedicalCertificateAction } from "@/actions/clinics/clinical-record/medical-certificate.action";
import { useState } from "react";

export interface MedicalCertificate {
  id: number;
  serialNumber: string;
  createdAt: string | Date;
  ClinicPatient?: {
    id: number;
    Patient?: {
      id: number;
      userId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      dob?: Date | null;
      UserAddresses?: Array<{
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      }>;
    };
  };
  Reason?: { name?: string };
  Finding?: { name?: string };
  Classification?: { name?: string };
  DocumentTemplate?: { id: number; name?: string };
  HealthCareProvider?: { id: number; };
  remarks?: string;
}


export interface MedicalCertificateItemProps {
  certificate: MedicalCertificate;
  onUpdated?: () => void;
  hpIds: number[];
}

export default function MedicalCertificateItem({ certificate, onUpdated, hpIds }: MedicalCertificateItemProps) {
  const patient = certificate.ClinicPatient?.Patient;
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleDeleteMedicalCertificate = async () => {
    toast.promise(promiseWrapper(deleteMedicalCertificateAction)({ medicalCertificateId: certificate.id }), {
      loading: "Deleting medical certificate...",
      success: (res) => {
        onUpdated?.();
        return res.message;
      },
      error: error => error
    });
  };

  const classificationName = certificate.Classification?.name;
  let classificationClass = "";
  if (classificationName === "CLASS A") {
    classificationClass = "bg-primary text-white";
  } else if (classificationName === "CLASS B") {
    classificationClass = "bg-blue-500 text-white";
  } else if (classificationName === "CLASS C") {
    classificationClass = "bg-yellow-500 text-black";
  } else if (classificationName === "CLASS D" || classificationName?.includes("D")) {
    classificationClass = "bg-destructive text-destructive-foreground";
  } else {
    classificationClass = "bg-secondary text-secondary-foreground";
  }

  return (
    <div
      className={cn(
        "-mx-2 flex items-center space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground odd:bg-accent odd:text-accent-foreground group/item "
      )}
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold leading-tight">{patient?.firstName ?? "Unknown"} {patient?.lastName ?? ""}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate line-clamp-1">
            {patient?.UserAddresses && patient.UserAddresses.length > 0
              ? `${patient.UserAddresses[0].address}, ${patient.UserAddresses[0].city}, ${patient.UserAddresses[0].state}, ${patient.UserAddresses[0].zipCode}`
              : "No Address"}
          </span>
          <div className="flex items-center justify-center w-12 text-center text-xs text-muted-foreground font-medium">
            <span className="flex items-center justify-center w-full h-full">{patient?.dob ? calculateAge(patient.dob) : "-"}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center min-w-[90px]">
              <Badge className={cn(classificationClass, "hover:bg-inherit hover:text-inherit")}>{certificate.Classification?.name ?? "-"}</Badge>
            </div>
            <div className="flex flex-col items-end min-w-[160px]">
              <span className="text-xs text-muted-foreground">{certificate.createdAt && dayjs(certificate.createdAt).format("MM/D/YYYY | h:mm A")}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DownloadMedicalCertificateAction certificate={{ id: certificate.id }} onUpdated={onUpdated}>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  className="invisible group-hover/item:visible text-primary hover:text-primary/90"
                >
                  <DownloadIcon className="h-4 w-4 hover:scale-125 transition-all" />
                </ActionButton>
              </DownloadMedicalCertificateAction>
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
                className="invisible group-hover/item:visible text-blue-600 hover:text-blue-500"
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
              <form action={handleDeleteMedicalCertificate}>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  className="invisible group-hover/item:visible text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="h-4 w-4 hover:scale-125 transition-all" />
                </ActionButton>
              </form>
            </TooltipTrigger>
            <TooltipContent side="top">Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <EditMedicalCertificateModal
        certificate={certificate}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdated={onUpdated}
        hpIds={hpIds}
      />
    </div>
  );
}
