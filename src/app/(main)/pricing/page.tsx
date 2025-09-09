import PricingMode from "@components/PricingMode";
import { Metadata } from "next";
import Suspend from "@components/Suspend";
import TenantPlanList from "../tenants/register/TenantPlanList";

export const metadata: Metadata = {
  title: "Pricing | Clinic EZ",
  description: "Compare and select from our competitive pricing",
};
interface PricingPageProps {
  searchParams: Promise<{
    freq: "MONTHLY" | "YEARLY";
  }>
}

export default async function PricingPage(props: PricingPageProps) {
  const { freq = "YEARLY" } = (await props.searchParams) ;

  return (
    <div className="container mx-auto my-10">
      <div className="prose max-w-full text-center">
        <h1>Tenant Pricing</h1>
        <p>
          Select the plan that best suits your needs. 
        </p>
      </div>
      <div className="flex justify-center">
        <PricingMode defaultMode={freq} />
      </div>
      <Suspend>
        <TenantPlanList frequency={freq} />
      </Suspend>
    </div>
  );
};

