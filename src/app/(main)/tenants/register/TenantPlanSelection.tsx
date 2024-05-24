"use client";

import PricingMode from '@components/PricingMode';
import TenantPlanList from './TenantPlanList';
import Suspend from '@components/Suspend';
import BackSubmitAndNext from '@components/SubmitAndNext';
interface TenantPlanSelectionProps {
  defaultPlan: string;
  freq: string;
  nextStep?: () => void;
  isFirstStep?: boolean;
}

export default function TenantPlanSelection(props: TenantPlanSelectionProps) {
  
  const { defaultPlan: initialPlan, freq, nextStep, isFirstStep } = props;
  
  return (
    <div>
      <div className='flex justify-between mt-5'>
        Select the plan that best suits your needs.
        <PricingMode defaultMode={freq}/>
      </div>
      <Suspend>
        <TenantPlanList initialPlan={initialPlan} freq={freq} nextStep={nextStep} />
      </Suspend>
      <BackSubmitAndNext
        actions={{
          next: nextStep,
        }}
        disabled={{
          next: !initialPlan,
          previous: isFirstStep,
          submit: true,
        }}
      />
    </div>
  );
}


