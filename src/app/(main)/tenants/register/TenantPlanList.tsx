"use client";

import Each from "@components/utils/Each";
import { cn } from "@lib/utils";
import { Button } from "@components/ui/button";
import { useAtom } from "jotai";
import { tenantApplyAtom } from "@state/tenant-apply";
import { usePlans } from "@hooks/usePlan";

interface TenantPlanListProps {
  frequency?: "MONTHLY" | "YEARLY";
  nextStep?: () => void;
}
export default function TenantPlanList({ frequency, nextStep }: TenantPlanListProps) {
  const {data: tenantPlans } = usePlans("TENANT", frequency);
  const [tenantApplication, setTenantApplication] = useAtom(tenantApplyAtom);

  const handleSelectPlan = (planId: number) => {
    setTenantApplication(prev => ({...prev, planId}));
    nextStep?.();
  }

  return (
    <div className="flex flex-wrap justify-center my-10 gap-5">
      <Each
        of={tenantPlans?.data ?? []}
        render={(plan) => {
          const discount = plan.firstPaymentDiscount;
          const price = Math.ceil(plan?.price * (1 - discount/100));
          return (
            <div className={cn("relative bg-primary flex-grow max-w-sm h-96 basis-72 rounded-md shadow-2xl",{
              "ring-4 ring-primary rounded-ss-none": tenantApplication.planId === plan.id
            }
            )}>
              <div className="bg-background opacity-98 rounded-ee-[5rem]  p-8 mr-6 h-80 ">
                <p className="~text-lg/2xl font-bold mb-2">₱{price} <span className="~text-base/xl font-normal">{frequency === "MONTHLY" ? "/mo" : "/yr"}</span> <span className="text-xs">{discount}% off</span></p>
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
                <Button 
                  onClick={() => handleSelectPlan(plan.id)}
                  className="text-white hover:scale-105 hover:font-bold transition-all"
                >Choose Plan</Button>
              </div>
            </div>
          )
        }}
      />
    </div>
  );
}
