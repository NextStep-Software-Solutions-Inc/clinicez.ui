"use client";
import { useMultiStepForm } from "@hooks/useMultiStepForm"
import { ReactElement } from "react"
import Stepper from "./Stepper/Stepper"
import TenantForm from "./TenantForm";


interface TenantApplicationWrapperProps{
children:ReactElement[]
}
const steps = ["Chosen Plan", "Set up Payment Method"];

export default function TenantApplicationWrapper(props:TenantApplicationWrapperProps ){
  const {currentStep, currentStepComponent, isComplete} = useMultiStepForm({
    steps: props.children,
    currentStep: 1
  })

  return(
    <>
      <Stepper steps={steps} currentStep={currentStep} complete={isComplete} />
      {!isComplete?currentStepComponent: <TenantForm/>}
    </>
  )
}