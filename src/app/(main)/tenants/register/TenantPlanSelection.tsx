import React from 'react';
import PricingMode from '@components/PricingMode';
import TenantPlanList from './TenantPlanList';
import Suspend from '@components/Suspend';
interface TenantPlanSelectionProps {
  defaultPlan: string;
  freq: string;
  nextStep?: () => void;
}

export default async function TenantPlanSelection(props: TenantPlanSelectionProps) {
  
  const { defaultPlan: initialPlan, freq, nextStep } = props;
  
  return (
    <div>
      <div className='flex justify-between mt-5'>
        Select the plan that best suits your needs.
        <PricingMode defaultMode={freq}/>
      </div>
      <Suspend>
        <TenantPlanList initialPlan={initialPlan} freq={freq} nextStep={nextStep} />
      </Suspend>
    </div>
  );
}


