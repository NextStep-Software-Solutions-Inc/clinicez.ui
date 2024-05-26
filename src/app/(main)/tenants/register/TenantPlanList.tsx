"use client";

import React, { use } from "react";
import { getTenantPlanPackage } from "../../pricing/plans.request";
import Each from "@components/utils/Each";
import Link from "next/link";
import { cn } from "@lib/utils";

interface TenantPlanListProps {
  freq?: string;
  initialPlan?: string;
  nextStep?: () => void;
}
const fetchTenantPlans = getTenantPlanPackage()
export default function TenantPlanList({ freq, initialPlan, nextStep }: TenantPlanListProps) {
  const tenantPlans = use(fetchTenantPlans);

  return (
    <div className="flex flex-wrap justify-between my-10 gap-5">
      <Each
        of={tenantPlans.response[freq as keyof typeof tenantPlans.response]}
        render={(plan) => (
          <div className={cn("relative bg-primary h-96 w-auto flex-grow basis-72 rounded-md  hover:animate-pulse shadow-2xl",
            initialPlan === plan.name.toLowerCase() && "ring-4 ring-primary rounded-ss-none"
          )}>
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
                <button className="text-white hover:scale-105 hover:font-bold transition-all">Choose Plan</button>
              </Link>
            </div>
          </div>
        )}
      />
    </div>
  );
}
