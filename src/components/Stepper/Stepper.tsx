"use client";

import React, { useState } from "react";
import Each from "../utils/Each";
import "./Stepper.css";


interface StepperProps {
  steps: string[];
  currentStep: number;
  complete?: boolean;
}
export default function Stepper({ steps, currentStep, complete = false }: StepperProps) {
  
  return (
    <div className="flex items-center justify-between">
      {steps?.map((step, i) => (
        <div
          key={i}
          className={`step-item ${currentStep === i + 1 && "active"} ${
            (i + 1 < currentStep || complete) && "complete"
          } `}
        >
          <div className="step">
            {i + 1 < currentStep || complete ? "✓" : i + 1}
          </div>
          <p className="text-gray-500 capitalize">{step}</p>
        </div>
      ))}
      
    </div>
  );
}
