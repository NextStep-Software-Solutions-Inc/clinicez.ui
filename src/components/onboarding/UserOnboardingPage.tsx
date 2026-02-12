"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@components/ui/card";
import OnboardingStepper from "./OnboardingStepper";
import BasicInfoStep from "./BasicInfoStep";
import ContactStep from "./ContactStep";
import AdditionalInfoStep from "./AdditionalInfoStep";
import ReviewStep from "./ReviewStep";
import ShellAccountBanner from "./ShellAccountBanner";
import type { OnboardingStep1Values, OnboardingStep2Values, OnboardingStep3Values, OnboardingFullValues } from "@/schemas/onboarding.schema";
import {
  saveOnboardingStep1Action,
  saveOnboardingStep2Action,
  saveOnboardingStep3Action,
  completeUserOnboardingAction,
  skipOnboardingAction,
} from "@/actions/onboarding/user-onboarding.action";

interface UserOnboardingData {
  id: number;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  suffix: string | null;
  nickname: string | null;
  mobile: string | null;
  telephone: string | null;
  dob: Date | null;
  gender: string | null;
  bloodType: string | null;
  civilStatus: string | null;
  placeOfBirth: string | null;
  religion: string | null;
  nationality: string | null;
  picture: string | null;
  onboardingStatus: string;
  profileCompletionStatus: string;
  accountType: string;
  firstLogin: Date | null;
  onboardingCompletedAt: Date | null;
}

interface UserOnboardingPageProps {
  userData: UserOnboardingData;
}

export default function UserOnboardingPage({
  userData,
}: UserOnboardingPageProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Collect form values across steps for the review
  const [collectedValues, setCollectedValues] = useState<
    Partial<OnboardingFullValues>
  >({
    firstName: userData.firstName ?? "",
    lastName: userData.lastName ?? "",
    dob: userData.dob ? new Date(userData.dob) : undefined,
    gender: (userData.gender as OnboardingStep1Values["gender"]) ?? undefined,
    email: userData.email ?? "",
    mobile: userData.mobile ?? "",
    middleName: userData.middleName,
    suffix: userData.suffix,
    nickname: userData.nickname,
    placeOfBirth: userData.placeOfBirth,
    civilStatus:
      (userData.civilStatus as OnboardingStep3Values["civilStatus"]) ??
      undefined,
    bloodType:
      (userData.bloodType as OnboardingStep3Values["bloodType"]) ?? undefined,
    telephone: userData.telephone,
    religion: userData.religion,
    nationality: userData.nationality,
  });

  const isShellAccount = userData.accountType === "SHELL";

  const handleStep1Submit = useCallback(
    async (values: OnboardingStep1Values) => {
      setIsLoading(true);
      try {
        const result = await saveOnboardingStep1Action(values);
        if (result.status) {
          setCollectedValues((prev) => ({ ...prev, ...values }));
          setCurrentStep(2);
          toast.success("Basic information saved!");
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Failed to save basic information.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleStep2Submit = useCallback(
    async (values: OnboardingStep2Values) => {
      setIsLoading(true);
      try {
        const result = await saveOnboardingStep2Action(values);
        if (result.status) {
          setCollectedValues((prev) => ({ ...prev, ...values }));
          setCurrentStep(3);
          toast.success("Contact information saved!");
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Failed to save contact information.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleStep3Submit = useCallback(
    async (values: OnboardingStep3Values) => {
      setIsLoading(true);
      try {
        const result = await saveOnboardingStep3Action(values);
        if (result.status) {
          setCollectedValues((prev) => ({ ...prev, ...values }));
          setCurrentStep(4);
          toast.success("Additional information saved!");
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Failed to save additional information.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await completeUserOnboardingAction();
      if (result.status) {
        toast.success("Welcome to Clinic EZ! Your profile is all set.");
        router.push("/?onboarding=complete");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to complete onboarding.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleSkip = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await skipOnboardingAction();
      if (result.status) {
        toast.info(
          "Onboarding skipped. You can update your profile anytime."
        );
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to skip onboarding.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {isShellAccount
            ? "Claim Your Account"
            : "Welcome to Clinic EZ"}
        </h1>
        <p className="text-muted-foreground">
          {isShellAccount
            ? "Complete your profile to activate your account."
            : "Let\u2019s get your profile set up in just a few steps."}
        </p>
      </div>

      {isShellAccount && (
        <ShellAccountBanner firstName={userData.firstName} />
      )}

      <OnboardingStepper currentStep={currentStep} />

      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <BasicInfoStep
              defaultValues={{
                firstName: collectedValues.firstName ?? "",
                lastName: collectedValues.lastName ?? "",
                dob: collectedValues.dob,
                gender: collectedValues.gender,
              }}
              onSubmit={handleStep1Submit}
              isLoading={isLoading}
            />
          )}

          {currentStep === 2 && (
            <ContactStep
              defaultValues={{
                email: collectedValues.email ?? "",
                mobile: collectedValues.mobile ?? "",
              }}
              onSubmit={handleStep2Submit}
              onBack={() => setCurrentStep(1)}
              isLoading={isLoading}
            />
          )}

          {currentStep === 3 && (
            <AdditionalInfoStep
              defaultValues={{
                middleName: collectedValues.middleName,
                suffix: collectedValues.suffix,
                nickname: collectedValues.nickname,
                placeOfBirth: collectedValues.placeOfBirth,
                civilStatus: collectedValues.civilStatus,
                bloodType: collectedValues.bloodType,
                telephone: collectedValues.telephone,
                religion: collectedValues.religion,
                nationality: collectedValues.nationality,
              }}
              onSubmit={handleStep3Submit}
              onBack={() => setCurrentStep(2)}
              onSkip={handleSkip}
              isLoading={isLoading}
            />
          )}

          {currentStep === 4 && (
            <ReviewStep
              values={collectedValues}
              onSubmit={handleComplete}
              onBack={() => setCurrentStep(3)}
              isLoading={isLoading}
              isShellAccount={isShellAccount}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
