'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { OnboardingStatus } from '@prisma/client';

interface OnboardingStatusBannerProps {
  status: OnboardingStatus;
  organizationName: string;
  completionDate?: Date | null;
}

export function OnboardingStatusBanner({
  status,
  organizationName,
  completionDate,
}: OnboardingStatusBannerProps) {
  if (status === OnboardingStatus.COMPLETED) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">Onboarding Complete</AlertTitle>
        <AlertDescription className="text-green-800">
          You successfully completed onboarding for {organizationName}
          {completionDate && (
            <span className="text-sm text-green-600 ml-1">
              on {new Date(completionDate).toLocaleDateString()}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === OnboardingStatus.PENDING) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 flex items-center gap-2">
          Membership Pending Approval
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            Pending
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-amber-800">
          Your membership request for {organizationName} is pending approval by an administrator.
          You will receive an email notification once your request has been reviewed.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === OnboardingStatus.IN_PROGRESS) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 flex items-center gap-2">
          Complete Your Onboarding
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            In Progress
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-blue-800">
          Please complete the remaining steps to finish onboarding for {organizationName}.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === OnboardingStatus.INCOMPLETE) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-900">Onboarding Incomplete</AlertTitle>
        <AlertDescription className="text-red-800">
          Your onboarding for {organizationName} is incomplete. Please contact an administrator
          for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
