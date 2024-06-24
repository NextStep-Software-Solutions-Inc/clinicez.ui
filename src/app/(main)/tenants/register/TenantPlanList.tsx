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
    <div className="flex flex-wrap justify-center my-10 gap-5">
      <Each
        of={tenantPlans}
        render={(plan) => {
          const discount = freq === "monthly" ? 0 : 0.1;
          // if yearly, multiply by 12 and less 10%
          const price = freq === "monthly" ? plan?.price : Math.ceil(plan?.price * 12 * (1 - discount));
          const frequency = freq === "monthly" ? "/mo" : "/yr";
          return (
            <div className={cn("relative bg-primary flex-grow max-w-sm h-96 basis-72 rounded-md  hover:animate-pulse shadow-2xl",
              initialPlan === plan.id.toString() && "ring-4 ring-primary rounded-ss-none"
            )}>
              <div className="bg-background opacity-98 rounded-ee-[5rem]  p-8 mr-6 h-80 ">
                <p className="~text-lg/2xl font-bold mb-2">₱{price} <span className="~text-base/xl font-normal">{frequency}</span> <span className="text-xs">{discount*100}% off</span></p>
                <h2 className="~text-base/lg mb-8 font-semibold border-b-2 border-gray-200 pb-2">{plan.name}</h2>
                <ul className="list-none list-inside text-sm">
                  <Each
                    of={plan?.Features}
                    render={(feature, index) => (
                      <li className={index !== 0 ? 'mt-2' : ''}>{feature.name}</li>
                    )}
                  />
                </ul>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Link href={{ 
                  pathname: "/tenants/register", 
                  query: { 
                    role: "tenant",
                    plan: plan?.id,
                    freq,
                  } 
                }}>
                  <button className="text-white hover:scale-105 hover:font-bold transition-all">Choose Plan</button>
                </Link>
              </div>
            </div>
          )
        }}
      />
    </div>
  );
}
