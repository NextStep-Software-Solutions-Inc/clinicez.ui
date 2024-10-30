"use client";
import { useMultiStepForm } from "@hooks/useMultiStepForm"
import { ReactElement } from "react"
import Stepper from "../../../../components/Stepper/Stepper"
import Link from "next/link";
import { Button } from "@components/ui/button";


interface TenantApplicationWrapperProps{
children:ReactElement[]
}
const steps = ["Choose Plan", "Payment Settlement", "Tenant Details"];

export default function TenantApplicationWrapper(props:TenantApplicationWrapperProps ){
  const {currentStep, currentStepComponent, isComplete} = useMultiStepForm({
    steps: props.children,
    currentStep: 1
  })

  return(
    <>
      <Stepper steps={steps} currentStep={currentStep} complete={isComplete} />
      {!isComplete ? currentStepComponent : (
        <div className="prose max-w-full mt-5 text-center">
          <h2 className="text-green-600">You are all set! 🎉</h2>
          <p>
          You have successfully subscribed to the Clinic EZ Plan. You can now access the tenant console to manage your tenancy.
          </p>
          <Link 
            target="_blank"
            href={process.env.NEXT_PUBLIC_APP_URL + "/console/tenant"}
          >
            <Button>Go to Tenant Console</Button>
          </Link>
        </div>
      )}
    </>
  )
}