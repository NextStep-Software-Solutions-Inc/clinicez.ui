"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { applyHPForApprovalAction } from "@/actions/hp.actions";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, XCircle, AlertTriangle, Send, RotateCcw } from "lucide-react";

type ApplicationStatus = "PENDING_PROFILE" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

interface ApplicationStatusBadgeProps {
  hpId: number;
  status: ApplicationStatus;
  hasProfile: boolean;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    containerClass: string;
    iconContainerClass: string;
    iconClass: string;
    labelClass: string;
    descClass: string;
  }
> = {
  PENDING_PROFILE: {
    icon: AlertTriangle,
    label: "Profile Incomplete",
    description:
      "Complete your profile below, then submit it for admin review.",
    containerClass: "border-amber-200 bg-amber-50/80",
    iconContainerClass: "bg-amber-100",
    iconClass: "text-amber-600",
    labelClass: "text-amber-800",
    descClass: "text-amber-700",
  },
  PENDING_APPROVAL: {
    icon: Clock,
    label: "Pending Approval",
    description:
      "Your application is under review by the ClinicEZ system admin. We will notify you once a decision is made.",
    containerClass: "border-blue-200 bg-blue-50/80",
    iconContainerClass: "bg-blue-100",
    iconClass: "text-blue-600",
    labelClass: "text-blue-800",
    descClass: "text-blue-700",
  },
  APPROVED: {
    icon: CheckCircle2,
    label: "Approved",
    description:
      "Your Healthcare Provider application has been approved! You are now part of the ClinicEZ network.",
    containerClass: "border-green-200 bg-green-50/80",
    iconContainerClass: "bg-green-100",
    iconClass: "text-green-600",
    labelClass: "text-green-800",
    descClass: "text-green-700",
  },
  REJECTED: {
    icon: XCircle,
    label: "Not Approved",
    description:
      "Your application was not approved. Please update your profile and resubmit, or contact support for assistance.",
    containerClass: "border-red-200 bg-red-50/80",
    iconContainerClass: "bg-red-100",
    iconClass: "text-red-600",
    labelClass: "text-red-800",
    descClass: "text-red-700",
  },
};

export default function HPApplicationStatusBadge({ hpId, status, hasProfile }: ApplicationStatusBadgeProps) {
  const router = useRouter();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const handleApply = async (successMessage: string) => {
    const result = await applyHPForApprovalAction(hpId);
    if (result.status) {
      toast.success(successMessage);
      router.refresh();
    } else {
      toast.error(result.message ?? "Failed to submit application.");
    }
  };

  return (
    <div className={`flex items-center gap-4 rounded-xl border-2 p-4 ${config.containerClass}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${config.iconContainerClass}`}>
        <Icon size={22} className={config.iconClass} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${config.labelClass}`}>{config.label}</p>
        <p className={`text-xs mt-0.5 ${config.descClass}`}>{config.description}</p>
      </div>
      {status === "PENDING_PROFILE" && (
        <Button
          size="sm"
          disabled={!hasProfile}
          onClick={() => handleApply("Application submitted successfully! The admin will review your profile.")}
          title={!hasProfile ? "Complete your profile before submitting" : undefined}
          className="shrink-0 gap-1.5"
        >
          <Send size={14} />
          Submit
        </Button>
      )}
      {status === "REJECTED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleApply("Application resubmitted for review.")}
          className="shrink-0 gap-1.5 border-red-300 text-red-700 hover:bg-red-100"
        >
          <RotateCcw size={14} />
          Resubmit
        </Button>
      )}
    </div>
  );
}
