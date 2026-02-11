'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stepper, Step } from '@/components/onboarding/Stepper';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { validateUserOnboarding } from '@/actions/onboarding/user-onboarding.action';
import {
  validateOrganizationOnboarding,
  completeOrganizationOnboarding,
  getOrganizationOnboardingRequirements,
} from '@/actions/onboarding/organization-onboarding.action';
import { OnboardingStatus } from '@prisma/client';

interface OrganizationOnboardingWrapperProps {
  userId: number;
  organizationId: number;
  orgUid: string;
  orgName: string;
  children: React.ReactNode;
}

export function OrganizationOnboardingWrapper({
  userId,
  organizationId,
  orgUid,
  orgName,
  children,
}: OrganizationOnboardingWrapperProps) {
  const router = useRouter();
  const [userOnboardingComplete, setUserOnboardingComplete] = useState<boolean | null>(null);
  const [orgOnboardingStatus, setOrgOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [missingUserFields, setMissingUserFields] = useState<string[]>([]);
  const [orgRequirements, setOrgRequirements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      setIsLoading(true);
      try {
        // Check user onboarding status
        const userResult = await validateUserOnboarding(userId);
        if (userResult.success && userResult.data) {
          setUserOnboardingComplete(userResult.data.isComplete);
          setMissingUserFields(userResult.data.missingFields);
        }

        // Check organization onboarding status
        const orgResult = await validateOrganizationOnboarding({
          userId,
          organizationId,
        });
        
        if (orgResult.success && orgResult.data) {
          setOrgOnboardingStatus(orgResult.data.onboardingStatus);
        }

        // Get organization requirements
        const reqResult = await getOrganizationOnboardingRequirements({
          userId,
          organizationId,
        });
        
        if (reqResult.success && reqResult.data) {
          setOrgRequirements(reqResult.data.roleRequirements || []);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [userId, organizationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user profile is incomplete, redirect to user onboarding
  if (userOnboardingComplete === false) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <CardTitle>Complete Your Profile First</CardTitle>
          </div>
          <CardDescription>
            Before joining {orgName}, you need to complete your user profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default">
            <AlertDescription>
              <strong>Missing required fields:</strong>
              <ul className="list-disc list-inside mt-2">
                {missingUserFields.map((field) => (
                  <li key={field} className="capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
            <Button onClick={() => router.push('/onboarding')}>
              Complete Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If org onboarding is complete, show success message
  if (orgOnboardingStatus === OnboardingStatus.COMPLETED) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>Onboarding Complete!</CardTitle>
          </div>
          <CardDescription>
            You have successfully completed the onboarding for {orgName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(`/organizations/${orgUid}/dashboard`)}>
            Go to Organization Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show organization-specific requirements if any
  if (orgRequirements.length > 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Organization Requirements</AlertTitle>
          <AlertDescription>
            This organization requires additional information based on your role:
            <ul className="list-disc list-inside mt-2">
              {orgRequirements.map((req) => (
                <li key={req} className="capitalize">
                  {req.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Render the organization join flow
  return <>{children}</>;
}
