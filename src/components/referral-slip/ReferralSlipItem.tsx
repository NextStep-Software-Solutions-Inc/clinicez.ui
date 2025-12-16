import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn, calculateAge } from "@lib/utils";
import { Edit, DownloadIcon, Trash2, User } from "lucide-react";
import dayjs from "@lib/day-utils";
import ActionButton from "../ActionButton";
import DownloadReferralSlipAction from "./DownloadReferralSlipAction";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { deleteReferralSlipAction } from "@/actions/clinics/clinical-record/referral-slip.action";
import { useState } from "react";
import EditReferralSlipModal from "./EditReferralSlipModal";
import { formatPatientAddress } from "@/lib/utils/format-patient-address";
import { formatHealthcareProviderName } from "@/lib/utils/format-healthcare-provider-name";

export interface ReferralSlip {
  id: number;
  serialNumber: string;
  createdAt: string | Date;
  history?: string;
  impression?: string;
  recommendation?: string;
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
  Reason?: { id: number; name?: string; description?: string };
  ReferredTo?: {
    id: number;
    User?: {
      firstName?: string;
      lastName?: string;
    };
    HPType?: {
      name?: string;
    };
  };
  reason?: string;
  referredTo?: string;
  DocumentTemplate?: { id: number; name?: string };
}

export interface ReferralSlipItemProps {
  referralSlip: ReferralSlip;
  onUpdated?: () => void;
  hpIds: number[];
  clinicUid?: string;
}

export default function ReferralSlipItem({ referralSlip, onUpdated, hpIds, clinicUid }: ReferralSlipItemProps) {
  const patient = referralSlip.ClinicPatient?.Patient;
  const [editModalOpen, setEditModalOpen] = useState(false);

  const itemClassName = cn(
    "-mx-2 flex items-center space-x-4 rounded-md p-2",
    "transition-all group/item",
    "hover:bg-accent hover:text-accent-foreground",
    "odd:bg-muted odd:text-accent-foreground"
  );

  const handleDeleteReferralSlip = async () => {
    toast.promise(promiseWrapper(deleteReferralSlipAction)({ id: referralSlip.id, hpIds }), {
      loading: "Deleting referral slip...",
      success: (res) => {
        onUpdated?.();
        return res.message;
      },
      error: error => error
    });
  };

  return (
    <div className={itemClassName}>
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold leading-tight">
            {patient?.firstName ?? "Unknown"} {patient?.lastName ?? ""}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ID: {referralSlip.serialNumber}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate line-clamp-1">
            {formatPatientAddress(patient)}
          </span>
          <div className="flex items-center justify-center w-12 text-center text-xs text-muted-foreground font-medium">
            <span className="flex items-center justify-center w-full h-full">
              {calculateAge(patient?.dob) ?? "-"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center min-w-[120px]">
              <span className="text-xs text-muted-foreground">
                {(() => {
                  if (referralSlip.referredTo) {
                    return referralSlip.referredTo;
                  }

                  // Fallback for backwards compatibility
                  const user = referralSlip.ReferredTo?.User;
                  const hpType = referralSlip.ReferredTo?.HPType;
                  const userName = formatHealthcareProviderName({ user: user });
                  const specialty = hpType?.name;

                  if (userName === "N/A") {
                    return "Unknown Provider";
                  }

                  return specialty ? `${userName} (${specialty})` : userName;
                })()}
              </span>
            </div>
            <div className="flex flex-col items-end min-w-[160px]">
              <span className="text-xs text-muted-foreground">
                {referralSlip.createdAt && dayjs(referralSlip.createdAt).format("MM/D/YYYY | h:mm A")}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DownloadReferralSlipAction referralSlip={{ id: referralSlip.id }} onUpdated={onUpdated}>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  className="invisible group-hover/item:visible text-primary hover:text-primary/90"
                >
                  <DownloadIcon className="h-4 w-4 hover:scale-125 transition-all" />
                </ActionButton>
              </DownloadReferralSlipAction>
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
              <form action={handleDeleteReferralSlip}>
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

      <EditReferralSlipModal
        referralSlip={referralSlip}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdated={onUpdated}
        hpIds={hpIds}
        clinicUid={clinicUid}
      />
    </div>
  );
}
