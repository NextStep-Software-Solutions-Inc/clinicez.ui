import { cn, calculateAge } from "@lib/utils";
import { HeartPulse, Trash2 } from "lucide-react";
import dayjs from "@lib/day-utils";
import ActionButton from "@/components/ActionButton";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { deleteHeartStationRequestAction } from "@/actions/clinics/clinical-record/heart-station.action";
import { useState } from "react";

export interface HeartStationRequestItemProps {
  request: HeartStationRequest;
  onUpdated?: () => void;
  hpIds: number[];
  clinicId: number;
}

export interface HeartStationRequest {
  id: number;
  serialNumber?: string | null;
  createdAt: string | Date;
  history?: string | null;
  reason?: string | null;
  impression?: string | null;
  HeartStationRequestProcedures?: Array<{
    HeartStationProcedure: {
      id: number;
      name: string;
      description?: string | null;
    };
  }>;
  ClinicPatient?: {
    id: number;
    Patient?: {
      id: number;
      userId: string;
      firstName?: string | null;
      lastName?: string | null;
      dob?: Date | null;
    };
  };
}

export default function HeartStationRequestItem({ request, onUpdated, hpIds }: HeartStationRequestItemProps) {
  const patient = request.ClinicPatient?.Patient;
  const [isDeleting, setIsDeleting] = useState(false);
  const procedureCount = request.HeartStationRequestProcedures?.length ?? 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    toast.promise(promiseWrapper(deleteHeartStationRequestAction)({ id: request.id, hpIds }), {
      loading: "Deleting heart station request...",
      success: (res) => {
        onUpdated?.();
        return res.message;
      },
      error: (error) => error as string,
      finally: () => setIsDeleting(false),
    });
  };

  return (
    <div
      className={cn(
        "-mx-2 flex items-center space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground odd:bg-accent odd:text-accent-foreground group/item"
      )}
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
        <HeartPulse className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold leading-tight">{patient?.firstName ?? "Unknown"} {patient?.lastName ?? ""}</span>
          <span className="text-xs text-muted-foreground">{request.serialNumber || ""}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground truncate">
            {procedureCount} {procedureCount === 1 ? "procedure" : "procedures"} requested
          </span>
          <div className="flex items-center justify-center w-12 text-center text-xs text-muted-foreground font-medium">
            <span className="flex items-center justify-center w-full h-full">{calculateAge(patient?.dob) ?? "-"}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end min-w-[160px]">
              <span className="text-xs text-muted-foreground">{request.createdAt && dayjs(request.createdAt).format("MM/D/YYYY | h:mm A")}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <ActionButton
          variant="ghost"
          size="icon"
          className="invisible group-hover/item:visible text-destructive hover:text-destructive/90"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 hover:scale-125 transition-all" />
        </ActionButton>
      </div>
    </div>
  );
}
