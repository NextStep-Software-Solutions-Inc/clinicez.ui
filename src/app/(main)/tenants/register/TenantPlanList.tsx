"use client";

import React, { useEffect, useState } from "react";
import Each from "@components/utils/Each";
import Link from "next/link";
import { cn } from "@lib/utils";
import { getPlansAction } from "@actions/plan.action";

interface TenantPlanListProps {
  freq?: string;
  initialPlan?: string;
  nextStep?: () => void;
}
export default function TenantPlanList({ freq, initialPlan, nextStep }: TenantPlanListProps) {
  const [tenantPlans, setTenantPlans] = useState<Awaited<ReturnType<typeof getPlansAction>> | []>([]);

  useEffect(() => {
    (async () => {
      const plans = (await getPlansAction()).filter((plan) => plan.type === "TENANT");
      setTenantPlans(plans);
    })()
  },[])


  return (
    <div className="flex flex-wrap justify-between my-10 gap-5">
      <Each
        of={tenantPlans}
        render={(plan) => (
          <div className={cn("relative bg-primary h-96 mx-auto basis-72 rounded-md  hover:animate-pulse shadow-2xl",
            initialPlan === plan.name.toLowerCase() && "ring-4 ring-primary rounded-ss-none"
          )}>
            <div className="bg-background opacity-98 rounded-ee-[5rem]  p-8 mr-6 h-80 ">
              <p className="text-2xl font-bold mb-4">₱{plan?.price}</p>
              <h2 className="text-xl mb-8 font-bold border-b-2 border-gray-200 pb-2">{plan.name}</h2>
              <ul className="list-none list-inside text-sm">
                <Each
                  of={plan?.Features}
                  render={(feature, index) => (
                    <li className={index !== 0 ? 'mt-4' : ''}>{feature.name}</li>
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
