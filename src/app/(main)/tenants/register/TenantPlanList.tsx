import React from "react";
import { getTenantPlanPackage } from "../../pricing/plans.request";
import Each from "@components/utils/Each";
import Link from "next/link";

interface TenantPlanListProps {
  freq: string;
  initialPlan: string;
  nextStep?: () => void;
}

export default async function TenantPlanList({ freq, initialPlan, nextStep }: TenantPlanListProps) {
  const tenantPlans = await getTenantPlanPackage()

  return (
    <div className="flex justify-between mt-10">
      {/* Mapping through the plans to display the boxes */}
      <Each
        of={tenantPlans.response[freq as keyof typeof tenantPlans.response]}
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
  );
}
