"use client";
import React from 'react';
import plans from '@public/json/plans.json';
import Each from './utils/Each';
import PricingMode from './PricingMode';
import Link from 'next/link';

interface TenantPlanSelectionProps {
  defaultPlan: string;
  freq: string;
  nextStep?: () => void;
}

export default function TenantPlanSelection(props: TenantPlanSelectionProps) {
  const { defaultPlan: initialPlan, freq, nextStep } = props;
  
  return (
    <>
      
      <div className='flex justify-between mt-5'>
        Select the plan that best suits your needs.
        <PricingMode defaultMode={freq}/>
      </div>
      <div className="flex justify-between mt-10">
        
        {/* Mapping through the plans to display the boxes */}
        <Each
          of={plans[freq as keyof typeof plans]}
          render={(p) => (
            <Link href={{
              pathname: '/tenants/register',
              query: {
                role: 'tenant',
                plan: p.name.toLowerCase(),
                freq,
              },
            }}
            className={`relative bg-teal-500 opacity-80 max-w-sm w-48 h-96 sm:w-1/2 lg:w-1/3 m-5 ${p.name.toLowerCase() === initialPlan ? 'lg:w-2/3 shadow-xl shadow-teal-500' : ''} transition-all duration-300 ease-in-out`}
            >
              {/* Updated onClick event to handle plan selection */}
              <div className={`bg-white hover:from-teal-600 hover:to-teal-700 shadow-md p-8 mr-6 h-80 relative z-10 ${p.name.toLowerCase() === initialPlan ? 'shadow-xl' : ''} transition-all duration-300 ease-in-out`}>
                <p className="text-2xl font-bold mb-4">{p.price}</p>
                <h2 className="text-xl mb-8 font-bold border-b-2 border-gray-200 pb-2">{p.name}</h2>
                <ul className="list-none list-inside text-sm">
                  {p.features.map((feature, i) => (
                    <li key={i} className={i !== 0 ? 'mt-4' : ''}>{feature}</li>
                  ))}
                </ul>
                {/* Render the "Next" button only for the selected plan */}
                {p.name.toLowerCase() === initialPlan && nextStep && (
                  <button onClick={nextStep} className="text-white font-medium absolute bottom-[-50px] mr-6">Next</button>
                )}
              </div>
            </Link>
          )}
        />
      </div>
    </>
  );
}


