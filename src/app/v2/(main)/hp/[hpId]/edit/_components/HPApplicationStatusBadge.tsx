"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { applyHPForApprovalAction } from "@/actions/hp.actions";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

type ApplicationStatus = "PENDING_PROFILE" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

interface ApplicationStatusBadgeProps {
  hpId: number;
  status: ApplicationStatus;
  hasProfile: boolean;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { icon: React.ReactNode; label: string; description: string; className: string }
> = {
  PENDING_PROFILE: {
    icon: <AlertCircle size={20} />,
    label: "Profile Incomplete",
    description: "Complete your profile below, then submit it for admin review.",
    className: "bg-amber-50 border-amber-200 text-amber-800",
  },
  PENDING_APPROVAL: {
    icon: <Clock size={20} />,
    label: "Pending Approval",
    description: "Your application is under review by the ClinicEZ system admin. We will notify you once a decision is made.",
    className: "bg-blue-50 border-blue-200 text-blue-800",
  },
  APPROVED: {
    icon: <CheckCircle size={20} />,
    label: "Approved",
    description: "Your Healthcare Provider application has been approved! You are now part of the ClinicEZ network.",
    className: "bg-green-50 border-green-200 text-green-800",
  },
  REJECTED: {
    icon: <XCircle size={20} />,
    label: "Rejected",
    description: "Your application was not approved. Please update your profile and resubmit, or contact support for assistance.",
    className: "bg-red-50 border-red-200 text-red-800",
  },
};

export default function HPApplicationStatusBadge({ hpId, status, hasProfile }: ApplicationStatusBadgeProps) {
  const router = useRouter();
  const config = STATUS_CONFIG[status];

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
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${config.className}`}>
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div className="flex-1 space-y-1">
        <p className="font-semibold">{config.label}</p>
        <p className="text-sm">{config.description}</p>
      </div>
      {status === "PENDING_PROFILE" && (
        <Button
          size="sm"
          disabled={!hasProfile}
          onClick={() => handleApply("Application submitted successfully! The admin will review your profile.")}
          title={!hasProfile ? "Complete your profile before submitting" : undefined}
        >
          Submit for Approval
        </Button>
      )}
      {status === "REJECTED" && (
        <Button size="sm" variant="outline" onClick={() => handleApply("Application resubmitted for review.")}>
          Resubmit
        </Button>
      )}
    </div>
  );
}
