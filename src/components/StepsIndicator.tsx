"use client"

import Link from "next/link";
import React from "react";
import Each from "./utils/Each";
import { useSearchParams } from "next/navigation";

interface IStepsIndicatorProps {
  steps: {
    id: number;
    label: string;
    completed: boolean;
  }[]
}

export default function StepsIndicator({steps}: IStepsIndicatorProps) {
  const searchParams = Object.fromEntries(useSearchParams());
  
  return (
    <div className="steps w-full ">
      <Each
        of={steps}
        render={(step) => {
          return (
            <Link href={{
              query: {
                ...searchParams,
                index: step.id
              }
            }}
            data-content={step.completed? "O" : "X"}
            className={`step no-underline ${step.completed? "step-primary" : ""}`}
            >
              <span className="step-label"style={{textDecoration: "none"}}>{step.label}</span>
            </Link>
          )
        }}
      />
      {
      }
    </div>
  );
}
