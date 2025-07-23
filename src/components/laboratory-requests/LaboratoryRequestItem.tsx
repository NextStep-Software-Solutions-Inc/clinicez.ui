import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn, calculateAge, capitalize } from "@lib/utils";
import { Edit, DownloadIcon, Trash2, User } from "lucide-react";
import dayjs from "@lib/day-utils";
import { Badge } from "@components/ui/badge";
import ActionButton from "../ActionButton";
import DownloadLaboratoryRequestAction from "@/components/laboratory-requests/DownloadLaboratoryRequestAction";
import EditLaboratoryRequestModal from "./EditLaboratoryRequestModal";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { deleteLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { useState } from "react";


export interface LaboratoryRequest {
  id: number;
  serialNumber?: string;
  createdAt: string | Date;
  impression?: string | null;
  _count?: {
    LaboratoryRequestDiagnostics?: number;
  };
  LaboratoryRequestDiagnostics?: Array<{
    LaboratoryDiagnostic: {
      id: number;
      name: string;
      category?: string;
    };
  }>;
  ClinicPatient?: {
    id: number;
    Patient?: {
      id: number;
      userId: string;
      firstName?: string | null;
      lastName?: string | null;
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
}


export interface LaboratoryRequestItemProps {
  request: LaboratoryRequest;
  onUpdated?: () => void;
}

export default function LaboratoryRequestItem({ request, onUpdated }: LaboratoryRequestItemProps) {
  const patient = request.ClinicPatient?.Patient;
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleDeleteLaboratoryRequest = async () => {
    toast.promise(promiseWrapper(deleteLaboratoryRequestAction)({ laboratoryRequestId: request.id }), {
      loading: "Deleting laboratory request...",
      success: (res) => {
        onUpdated?.();
        return res.message;
      },
      error: error => error
    });
  };

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
          <span className="text-xs text-muted-foreground truncate">
            {request._count?.LaboratoryRequestDiagnostics ?? 0} {request._count?.LaboratoryRequestDiagnostics === 1 ? "test" : "tests"} requested
          </span>
          <div className="flex items-center justify-center w-12 text-center text-xs text-muted-foreground font-medium">
            <span className="flex items-center justify-center w-full h-full">{patient?.dob ? calculateAge(patient.dob) : "-"}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end min-w-[160px]">
              <span className="text-xs text-muted-foreground">{request.createdAt && dayjs(request.createdAt).format("MM/D/YYYY | h:mm A")}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DownloadLaboratoryRequestAction request={{ id: request.id }} onUpdated={onUpdated}>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  className="invisible group-hover/item:visible text-primary hover:text-primary/90"
                >
                  <DownloadIcon className="h-4 w-4 hover:scale-125 transition-all" />
                </ActionButton>
              </DownloadLaboratoryRequestAction>
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
              <form action={handleDeleteLaboratoryRequest}>
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

      <EditLaboratoryRequestModal
        request={request}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdated={onUpdated}
      />
    </div>
  );
}
