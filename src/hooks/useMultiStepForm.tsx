import React, { ReactElement, ReactNode } from "react";

type StepPros = {
  children: ReactNode;
  nextStep: () => void;
  prevStep: () => void;
  setComplete: (value: boolean) => void;
  startOver: () => void;
  isComplete: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
};

interface useMultiStepFormProps {
  steps: ReactElement[];
  currentStep?: number;
}

export function useMultiStepForm({ steps,  currentStep: activeStep = 1} : useMultiStepFormProps) {
  const [currentStep, setCurrentStep] = React.useState(activeStep);
  const [isComplete, setIsComplete] = React.useState(false);
  const childrenArray = React.Children.toArray(steps);
  const currentStepComponent = childrenArray[currentStep - 1] as ReactElement<StepPros>;
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const startOver = () => {
    setCurrentStep(1);
  };

  const setComplete = (value = true) => {
    setIsComplete(value);
  }
  const isLastStep = currentStep === childrenArray.length;
  const isFirstStep = currentStep === 1;
  const totalSteps = childrenArray.length;
  const currentStepComponentClone = React.cloneElement(currentStepComponent, {
    nextStep,
    prevStep,
    startOver,
    setComplete,
    isComplete,
    isFirstStep,
    isLastStep,
    totalSteps,
  });

  return {
    currentStep,
    nextStep,
    prevStep,
    startOver,
    setComplete,
    isFirstStep,
    isLastStep,
    totalSteps,
    isComplete,
    currentStepComponent: currentStepComponentClone,
  }
};
