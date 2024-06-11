"use client";

import React from "react";
import Stepper from "@components/Stepper/Stepper";
import {useMultiStepForm} from "@hooks/useMultiStepForm";
import { Button } from "@components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Suspend from "@components/Suspend";

const steps = ["Role", "Plan", "Payment", "Confirmation"];
interface ApplicationFormProps {
    currentStep: number;
    children: React.ReactElement[];
}

export default function ApplicationForm({currentStep: cs, children }: ApplicationFormProps) {
  const {currentStep, currentStepComponent, isComplete} = useMultiStepForm({
    currentStep: cs,
    steps: children,
  })
  return (
    <div className="my-5 content">
      <Stepper steps={steps} currentStep={currentStep} complete={isComplete } />
      {!isComplete ? <Suspend>{currentStepComponent}</Suspend> : (
        <div className="rounded overflow-hidden shadow-lg my-16 py-16">
          <div className="text-center min-w-full space-y-5">
            <h1 className="text-green-600 text-3xl font-bold">Application Complete 🎉</h1>
            <p className=" text-gray-500">Thank you for submitting your application. We will review and get back to you shortly.</p>
            <Link href="/org/dashboard" >
              <Button className="mt-5">Go to Dashboard <ArrowRight/></Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
