"use client";

import Stepper from "@components/Stepper/Stepper";
import { useMultiStepForm } from "@hooks/useMultiStepForm";
import React from "react";
import OrganizationStepComplete from "./OrganizationStepComplete";

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

  const { currentStepComponent, currentStep, isComplete, startOver } = useMultiStepForm({
    steps: children,
    currentStep: cs,
  });
  return (
    <div className="">
      <Stepper steps={steps.map(s => s.label)} currentStep={currentStep} complete={isComplete} />
      {!isComplete ? currentStepComponent : <OrganizationStepComplete startOver={startOver} />}
    </div>
  );
}

