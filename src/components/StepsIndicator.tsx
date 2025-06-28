"use client"

import Link from "next/link";
import React from "react";
import Each from "./utils/Each";
import { useSearchParams } from "next/navigation";
import { TabsList, TabsTrigger } from "@components/ui/tabs";
import { cn } from "@lib/utils";

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
    <TabsList className={cn(`grid w-full grid-cols-4`)}>
      <Each
        of={steps}
        render={(step) => {
          return (
            <Link
              href={{
                query: {
                  ...searchParams,
                  index: step.label
                }
              }}
            >
              <TabsTrigger className="w-full capitalize" value={step.label}>{step.label}</TabsTrigger>
            </Link>
          );
        }}
      />
    </TabsList>
  );
}
