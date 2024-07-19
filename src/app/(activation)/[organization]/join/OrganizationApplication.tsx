"use client";

import Stepper from "@components/Stepper/Stepper";
import { useMultiStepForm } from "@hooks/useMultiStepForm";
import React from "react";
import { Button } from "@components/ui/button";
import Link from "next/link";

interface OrganizationStepProps {
    currentStep: number;
    children: React.ReactElement[];
  }

const steps = [
  { label: "Select Role" },
  { label: "Additional Information" },
  { label: "Review & Submit" }
];

export default function OrganizationApplication({ children, currentStep: cs }: OrganizationStepProps) {

  const { currentStepComponent, currentStep, isComplete } = useMultiStepForm({
    steps: children,
    currentStep: cs,
  });
  return (
    <div className="">
      <Stepper steps={steps.map(s => s.label)} currentStep={currentStep} complete={isComplete} />
      {!isComplete ? currentStepComponent : <OrganizationStepComplete />}
    </div>
  );
}


export const OrganizationStepComplete = () => {
 
  return (
    <>
      <div className="shadow-2xl p-10 rounded-md">
        <div className="text-center min-w-full my-10 space-y-5">
          <h2 className="text-2xl font-bold text-green-500">Application Sent!</h2>
          <p>
        Your application has been successfully sent to the organization. You will be notified once your application has been reviewed.
          </p>
          <Link href="/" className="">
            <Button className="my-5">Go Home</Button>
          </Link>
        </div>
      </div>
    </>
  );
};
