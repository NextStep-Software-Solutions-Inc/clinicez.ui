"use client";

import Stepper from "@components/Stepper/Stepper"
import { Button } from "@components/ui/button";
import { SheetClose } from "@components/ui/sheet";
import { useMultiStepForm } from "@hooks/useMultiStepForm"

interface BookAppointmentStepProps {
    initialStep: number
    children: React.ReactElement[]
}
export default function BookAppointmentSteps({ initialStep = 1, children }: BookAppointmentStepProps) {

  const {currentStep, currentStepComponent, isComplete} = useMultiStepForm({
    steps: children,
    currentStep: initialStep
  })

  return (
    <div className="container flex flex-col gap-4 my-10">
      <Stepper complete={isComplete} steps={["Pick Time Slot", "Chief Complaint", "Consent", "Review"]} currentStep={currentStep}/>
      {!isComplete ? currentStepComponent : (
        <div className="prose max-w-full text-center my-10">
          <h2 className="">You had successfully booked your appointment. 🎉</h2>
          <p>Please keep your line open as you will receive a notification from Clinic EZ when healthcare provider approves you booking.</p>
          <SheetClose asChild>
            <Button>Got it.</Button>
          </SheetClose>
        </div>
      )}
    </div>
  )
}
