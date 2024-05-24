"use client";
import { useMultiStepForm } from "@hooks/useMultiStepForm"
import { ReactElement } from "react"
import Stepper from "../../../../components/Stepper/Stepper"
import Link from "next/link";
import { Button } from "@components/ui/button";


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
      {!isComplete ? currentStepComponent : (
        <div className="prose max-w-full mt-5 text-center">
          <h2 className="text-green-600">You are All Set! 🎉</h2>
          <p>
          You have successfully subscribed to the Clinic EZ Plan. You can now access the admin console to manage your tenants.
          </p>
          <Link 
            target="_blank"
            href="https://clinic-ez-admin.vercel.app/tenants?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySWQiOiI3NDFkNTJhOC1lZTYzLTQ2ZTMtYTE3ZS1mMzJmZmUwY2RiNTkiLCJFbWFpbCI6IndhY2FuYW0yMEBnbWFpbC5jb20iLCJBY2NvdW50VHlwZSI6IjEiLCJuYmYiOjE3MTIzOTE0ODIsImV4cCI6MTcxNDk4ODg4MiwiaWF0IjoxNzEyMzkxNDgyfQ.fNKngLCdsR8MS6utQLBbkU7TUtCmj0NZLxt_dQ8jA8w"
          >
            <Button>Go to Admin Console</Button>
          </Link>
        </div>
      )}
    </>
  )
}