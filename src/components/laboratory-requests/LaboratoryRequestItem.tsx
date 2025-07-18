import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn } from "@lib/utils";
import { Archive, DownloadIcon, Trash2, User } from "lucide-react";
import dayjs from "@lib/day-utils";
import { Badge } from "@components/ui/badge";
import ActionButton from "../ActionButton";
import DownloadLaboratoryRequestAction from "@/components/laboratory-requests/DownloadLaboratoryRequestAction";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { deleteLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";


export interface LaboratoryRequest {
  id: number;
  serialNumber?: string;
  createdAt: string | Date;
  status?: string;
  ClinicPatient?: {
    id: number;
    Patient?: {
      id: number;
      userId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      UserAddresses?: Array<{
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      }>;
      age?: number;
    };
  };
}


export interface LaboratoryRequestItemProps {
  request: LaboratoryRequest;
  onUpdated?: () => void;
}

export default function LaboratoryRequestItem({ request, onUpdated }: LaboratoryRequestItemProps) {
  const patient = request.ClinicPatient?.Patient;
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
        <span className="font-semibold text-base leading-tight">{patient?.firstName ?? "Unknown"} {patient?.lastName ?? ""}</span>
        <span className="text-xs text-muted-foreground truncate">ID: {request.serialNumber ?? '-'}</span>
      </div>
      <div className="flex items-center justify-center w-12 text-center text-sm text-muted-foreground font-medium">
        {typeof patient?.age === "number" ? patient.age : "-"}
      </div>
      <div className="flex items-center min-w-[90px]">
        <Badge variant="secondary">{request.status ?? "-"}</Badge>
      </div>
      <div className="flex flex-col items-end min-w-[160px]">
        <span className="text-xs text-muted-foreground">{request.createdAt && dayjs(request.createdAt).format("MM/D/YYYY | h:mm A")}</span>
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
                className="invisible group-hover/item:visible text-destructive hover:text-destructive/90"
              >
                <Archive className="h-4 w-4 hover:scale-125 transition-all" />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent side="top">Archive</TooltipContent>
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
    </div>
  );
}
