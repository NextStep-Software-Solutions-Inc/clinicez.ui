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
    <div className="flex flex-wrap justify-between my-10 gap-5">
      <Each
        of={tenantPlans.response[freq as keyof typeof tenantPlans.response]}
        render={(plan) => (
          <div className="relative bg-primary h-96 w-auto flex-grow basis-72 rounded-md">
            <div className="bg-background opacity-98 rounded-ee-[5rem]  p-8 mr-6 h-80 ">
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
