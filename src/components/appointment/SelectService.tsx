"use client";

import React from "react";
import FilterForm from "./FilterForm";

interface SelectServiceProps {
    nextStep?: () => void;
    prevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}
export default function SelectService({nextStep, prevStep, isFirstStep, isLastStep}: SelectServiceProps) {
  const handleNext = () => {
    nextStep?.();
  }
  return (
    <div className="shadow-lg w-full p-8 bg-white/20 dark:bg-gray-800/20 rounded-md ">
     
      <div className="overflow-y-auto max-h-[calc(50dvh)] no-scrollbar scrollBox px-2">
        <div className="flex lg:flex-row flex-col items-center gap-5 justify-center my-5">
          <FilterForm
            onContinue={handleNext}
          />
        </div>
      </div>
    </div>
  );
}
