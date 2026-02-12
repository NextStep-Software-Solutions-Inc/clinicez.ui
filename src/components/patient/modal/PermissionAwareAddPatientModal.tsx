"use client";

import { useHasPermission } from "@/hooks/useHasPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { useUser } from "@clerk/nextjs";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { AlertCircle } from "lucide-react";
import AddPatientModal from "./AddPatientModal";

interface PermissionAwareAddPatientModalProps {
  clinicUid: string;
  onAddPatient?: () => void;
  roleName?: string;
}

/**
 * Permission-aware wrapper for AddPatientModal
 * Only shows the "Add Patient" button if user has CREATE:CLINIC:PATIENT permission
 */
export default function PermissionAwareAddPatientModal({
  clinicUid,
  onAddPatient,
  roleName
}: PermissionAwareAddPatientModalProps) {
  const { user } = useUser();
  
  const { hasPermission, isLoading, error } = useHasPermission(
    user?.id,
    [PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name],
    "CLINIC"
  );

  // While loading, don't show anything
  if (isLoading) {
    return null;
  }

  // If there's an error fetching permissions, show an alert
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Permission Error</AlertTitle>
        <AlertDescription>
          Unable to verify permissions. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  // If user doesn't have permission, don't show the button
  if (!hasPermission) {
    return null;
  }

  // User has permission, show the modal
  return (
    <AddPatientModal
      clinicUid={clinicUid}
      onAddPatient={onAddPatient}
      roleName={roleName}
    />
  );
}
