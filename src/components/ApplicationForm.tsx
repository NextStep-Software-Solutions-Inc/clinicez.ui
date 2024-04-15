"use client";

import React from "react";
import Stepper from "./Stepper/Stepper";
import steps from "@public/json/steps.json"
import {useMultiStepForm} from "@hooks/useMultiStepForm";

interface ApplicationFormProps {
    currentStep: number;
    children: React.ReactElement[];
}

export default function ApplicationForm({currentStep: cs, children }: ApplicationFormProps) {
  const {currentStep, currentStepComponent, isComplete} = useMultiStepForm({
    currentStep: cs,
    steps: children
  })
  return (
    <>
      <Stepper steps={steps.map(s => s.label)} currentStep={currentStep} complete={isComplete} />
      {!isComplete ? currentStepComponent : (
        <div className="text-center min-w-full mb-10 text-green-400">
          <h1 className="text-green-600">Application Complete</h1>
          <p className="text-lg text-gray-500">Thank you for submitting your application. We will review and get back to you shortly.</p>
        </div>
      )}
    </>
  );
}
