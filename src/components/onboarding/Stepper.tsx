'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                    {
                      'bg-primary border-primary text-primary-foreground': isCompleted,
                      'border-primary text-primary': isCurrent,
                      'border-muted-foreground/30 text-muted-foreground': !isCompleted && !isCurrent,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" fill={isCurrent ? 'currentColor' : 'none'} />
                  )}
                </div>

                {/* Step Title */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn('text-sm font-medium', {
                      'text-primary': isCompleted || isCurrent,
                      'text-muted-foreground': !isCompleted && !isCurrent,
                    })}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn('flex-1 h-0.5 mx-4 transition-all', {
                    'bg-primary': isCompleted,
                    'bg-muted-foreground/30': !isCompleted,
                  })}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
