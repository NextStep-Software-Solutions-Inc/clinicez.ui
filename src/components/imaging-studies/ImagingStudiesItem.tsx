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
import DownloadImagingStudiesAction from "./DownloadImagingStudiesAction";
import EditImagingStudyModal from "./EditImagingStudyModal";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { deleteImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { useState } from "react";
import { PatientProfile } from "../consultation/ConsultationDetails";


export interface ImagingStudy {
  id: number;
  serialNumber?: string;
  createdAt: string | Date;
  history?: string;
  reason?: string;
  impression?: string;
}


export interface ImagingStudiesItemProps {
  study: ImagingStudy;
  userInfo?: PatientProfile | null;
  onUpdated?: () => void;
}

export default function ImagingStudiesItem({ study, userInfo, onUpdated }: ImagingStudiesItemProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleDeleteImagingStudy = async () => {
    toast.promise(promiseWrapper(deleteImagingStudyAction)({ imagingStudyId: study.id }), {
      loading: "Deleting imaging study...",
      success: (res) => {
        onUpdated?.();
        return res.message;
      },
      error: error => error
    });
  };

  const ageDisplay = userInfo?.dob ? String(calculateAge(userInfo.dob)) : "-";

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
          <span className="text-xs font-semibold leading-tight">{userInfo?.firstName ?? "Unknown"} {userInfo?.lastName ?? ""}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate">
            {study.serialNumber ? `ID: ${study.serialNumber}` : "No ID"}
          </span>
          <div className="flex items-center justify-center w-12 text-center text-xs text-muted-foreground font-medium">
            <span className="flex items-center justify-center w-full h-full">{ageDisplay}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end min-w-[160px]">
              <span className="text-xs text-muted-foreground">{study.createdAt && dayjs(study.createdAt).format("MM/D/YYYY | h:mm A")}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DownloadImagingStudiesAction study={{ id: study.id }} onUpdated={onUpdated}>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  className="invisible group-hover/item:visible text-primary hover:text-primary/90"
                >
                  <DownloadIcon className="h-4 w-4 hover:scale-125 transition-all" />
                </ActionButton>
              </DownloadImagingStudiesAction>
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
              <form action={handleDeleteImagingStudy}>
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

      <EditImagingStudyModal
        study={study}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdated={onUpdated}
        userInfo={userInfo ?? null}
      />
    </div>
  );
}
