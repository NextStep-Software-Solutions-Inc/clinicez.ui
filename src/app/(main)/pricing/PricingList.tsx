import React from "react";
import { getTenantPlanPackage } from "./plans.request";
import Each from "@components/utils/Each";
import Link from "next/link";

interface PricingListProps {
  freq: string
}

export default async function PricingList({ freq }: PricingListProps) {
  const tenantPlans = await getTenantPlanPackage()

  return (
    <div className="flex flex-wrap justify-between mt-10">
      <Each
        of={tenantPlans.response[freq as keyof typeof tenantPlans.response]}
        render={(plan) => (
          <div className="relative bg-teal-500 opacity-80 max-w-sm w-48 h-96 sm:w-1/2 lg:w-1/3 m-5 shadow-lg shadow-teal-500">
            <div className="bg-white hover:from-teal-600 hover:to-teal-700 shadow-lg p-8 mr-6 h-80 relative z-10 ">
              <p className="text-2xl font-bold mb-4">{plan?.price}</p>
              <h2 className="text-xl mb-8 font-bold border-b-2 border-gray-200 pb-2">{plan.name}</h2>
              <ul className="list-none list-inside text-sm">
                <Each
                  of={plan?.features}
                  render={(feature, index) => (
                    <li className={index !== 0 ? 'mt-4' : ''}>{feature}</li>
                  )}
                />
              </ul>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <Link href={{ 
                pathname: "/tenants/register", 
                query: { 
                  role: "tenant",
                  plan: plan?.name.toLocaleLowerCase(),
                  freq,
                } 
              }}>
                <button className=" text-white">Choose Plan</button>
              </Link>
            </div>
          </div>
        )}
      />
    </div>
  );
}
