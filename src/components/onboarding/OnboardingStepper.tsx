"use client";

import { cn } from "@lib/utils";
import { Check } from "lucide-react";
import { ONBOARDING_STEPS } from "@/schemas/onboarding.schema";

interface OnboardingStepperProps {
  currentStep: number;
}

export default function OnboardingStepper({
  currentStep,
}: OnboardingStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {ONBOARDING_STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <div key={step.name} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    isCompleted &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    isCurrent &&
                      "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                    !isCompleted &&
                      !isCurrent &&
                      "border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCompleted && "text-emerald-600",
                    isCurrent && "text-primary font-semibold",
                    !isCompleted &&
                      !isCurrent &&
                      "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < ONBOARDING_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-all duration-300",
                    currentStep > stepNumber + 1
                      ? "bg-emerald-500"
                      : currentStep > stepNumber
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
