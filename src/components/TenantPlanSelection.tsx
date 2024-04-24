"use client";
import React, { useState } from 'react';

interface TenantPlanSelectionProps {
  defaultPlan: string;
  nextStep?: () => void;
}

const plans = [
  {
    name: 'Basic',
    price: '₱500/month',
    features: ['5 Users', 'Basic Support', '500GB Storage']
  },
  {
    name: 'Small',
    price: '₱1000/month',
    features: ['15 Users', 'Priority Support', '1TB Storage', 'Data Backup']
  },
  {
    name: 'Large',
    price: '₱1500/month',
    features: ['Unlimited Users', '24/7 Support', 'Unlimited Storage', 'Data Backup', 'Analytics Dashboard']
  },
];

export default function TenantPlanSelection(props: TenantPlanSelectionProps) {
  const { defaultPlan: initialPlan, nextStep } = props;
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
  };

  return (
    <div className="flex justify-center mt-10">
      {/* Mapping through the plans to display the boxes */}
      {plans.map((p, index) => (
        <div key={index} className={`relative bg-teal-500 opacity-80 max-w-sm w-48 h-96 sm:w-1/2 lg:w-1/3 m-5 ${p.name.toLowerCase() === selectedPlan ? 'lg:w-2/3 shadow-xl shadow-teal-500' : ''} transition-all duration-300 ease-in-out`} onClick={() => handlePlanSelect(p.name.toLowerCase())}>
        {/* Updated onClick event to handle plan selection */}
          <div className={`bg-white hover:from-teal-600 hover:to-teal-700 shadow-md p-8 mr-6 h-80 relative z-10 ${p.name.toLowerCase() === selectedPlan ? 'shadow-xl' : ''} transition-all duration-300 ease-in-out`}>
            <p className="text-2xl font-bold mb-4">{p.price}</p>
            <h2 className="text-xl mb-8 font-bold border-b-2 border-gray-200 pb-2">{p.name}</h2>
            <ul className="list-none list-inside text-sm">
              {p.features.map((feature, i) => (
                <li key={i} className={i !== 0 ? 'mt-4' : ''}>{feature}</li>
              ))}
            </ul>
            {/* Render the "Next" button only for the selected plan */}
            {p.name.toLowerCase() === selectedPlan && nextStep && (
               <button onClick={nextStep} className="text-white font-medium absolute bottom-[-50px] mr-6">Next</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


