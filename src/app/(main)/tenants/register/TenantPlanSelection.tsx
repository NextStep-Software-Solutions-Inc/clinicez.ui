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
      <div className="prose max-w-full mt-5 text-center md:text-left">
        <h3 className="">Choose Plan</h3>
        <p>
          Select the plan that best suits your needs.
        </p>
      </div>
      <div className='flex justify-center md:justify-end mt-5'>
        <PricingMode defaultMode={freq}/>
      </div>
      <div className='shadow-lg w-full p-4 bg-background rounded-md'>
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
    </div>
  );
}


