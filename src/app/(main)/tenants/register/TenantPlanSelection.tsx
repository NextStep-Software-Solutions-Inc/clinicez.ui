"use client";

import PricingMode from '@components/PricingMode';
import TenantPlanList from './TenantPlanList';
import Suspend from '@components/Suspend';
interface TenantPlanSelectionProps {
  freq: "MONTHLY" | "YEARLY";
  nextStep?: () => void;
  isFirstStep?: boolean;
}

export default function TenantPlanSelection(props: TenantPlanSelectionProps) {
  const { freq, nextStep } = props;
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
          <TenantPlanList frequency={freq} nextStep={nextStep} />
        </Suspend>
      </div>
    </div>
  );
}


