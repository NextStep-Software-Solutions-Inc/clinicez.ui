import Link from "next/link";
import PricingMode from "@components/PricingMode";
import Each from "@components/utils/Each";
import { getTenantPlanPackage } from "./plans.request";

interface PricingPageProps {
  searchParams: {
    freq: string
  }
}

export default async function PricingPage(props: PricingPageProps) {
  const tenantPlans = await getTenantPlanPackage()
  const { freq = "yearly" } = props.searchParams ;

  return (
    <div className="content container mx-auto px-4 mt-10">
      <div className="prose max-w-full">
        <h1>Tenant Pricing</h1>
        <p>
          Select the plan that best suits your needs. 
        </p>
      </div>
      <div className="flex justify-end">
        <PricingMode defaultMode={freq} />
      </div>
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
    </div>
  );
};

