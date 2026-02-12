"use client";

import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Info } from "lucide-react";

interface ShellAccountBannerProps {
  firstName?: string | null;
}

export default function ShellAccountBanner({
  firstName,
}: ShellAccountBannerProps) {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-blue-800">
        Welcome{firstName ? `, ${firstName}` : ""}! Your account is ready to be
        set up.
      </AlertTitle>
      <AlertDescription className="text-blue-700">
        A healthcare provider has created an account for you. Please complete the
        onboarding steps below to claim your account and start using Clinic EZ.
        All your medical records and appointments will be available once you
        complete the setup.
      </AlertDescription>
    </Alert>
  );
}
