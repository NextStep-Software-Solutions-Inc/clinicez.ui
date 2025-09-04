"use client";

import React, { useEffect, useState } from "react";
import Stepper from "@components/Stepper/Stepper";
import { useMultiStepForm } from "@hooks/useMultiStepForm";
import { Button } from "@components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Suspend from "@components/Suspend";
import { getHPAction } from "@actions/hp.actions";
import { useUser } from "@clerk/nextjs";

const steps = ["Healthcare Provider Type", "Plan", "Payment", "Confirmation"];
interface ApplicationFormProps {
  currentStep: number;
  children: React.ReactElement[];
}

export default function ApplicationForm({ currentStep: cs, children }: ApplicationFormProps) {
  const { currentStep, currentStepComponent, isComplete } = useMultiStepForm({
    currentStep: cs,
    steps: children,
  })
  return (
    <div className="my-5 content">
      <Stepper steps={steps} currentStep={currentStep} complete={isComplete} />
      {!isComplete ? <Suspend>{currentStepComponent}</Suspend> : (
        <div className="rounded overflow-hidden shadow-lg my-16 py-16">
          <div className="text-center min-w-full space-y-5">
            <h1 className="text-green-600 text-3xl font-bold">Application Complete 🎉</h1>
            <p className=" text-gray-500">Thank you for submitting your application. We will review and get back to you shortly.</p>
            <GotoHpProfile />
          </div>
        </div>
      )}
    </div>
  );
}


export const GotoHpProfile = () => {
  const { user } = useUser()
  const [hp, setHp] = useState<Awaited<ReturnType<typeof getHPAction>>>()
  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      setHp(await getHPAction({ userId: user.id ?? "" }))
    })()
  }, [user?.id])

  if (!hp) return null;
  return (
    <Link href={`/hp/${hp.id}`} >
      <Button className="mt-5">Go to Profile <ArrowRight /></Button>
    </Link>
  );
}