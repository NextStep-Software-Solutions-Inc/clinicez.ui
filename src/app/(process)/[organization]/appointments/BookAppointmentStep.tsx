"use client";

import Stepper from "@components/Stepper/Stepper"
import { useMultiStepForm } from "@hooks/useMultiStepForm"


interface BookAppointmentStepProps {
    intialStep: number
    children: React.ReactElement[]
}
export default function BookAppointmentStep({ intialStep = 1, children }: BookAppointmentStepProps) {

  const {currentStep, currentStepComponent, isComplete} = useMultiStepForm({
    steps: children,
    currentStep: intialStep
  })

  return (
    <>
      <Stepper complete={isComplete} steps={["Select Time Slot", "Chief Complaint"]} currentStep={currentStep}/>
      {!isComplete ? currentStepComponent : <h1>Appointment Booked</h1>}
    </>
  )
}
