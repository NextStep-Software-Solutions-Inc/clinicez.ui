import PricingMode from "@components/PricingMode";
import { Metadata } from "next";
import Suspend from "@components/Suspend";
import TenantPlanList from "../tenants/register/TenantPlanList";

export const metadata: Metadata = {
  title: "Pricing | Clinic EZ",
  description: "Compare and select from our competitive pricing",
};

interface PricingPageProps {
  searchParams: {
    freq: string
  }
}

export default async function PricingPage(props: PricingPageProps) {
  const { freq = "yearly" } = props.searchParams ;

  return (
    <div className="content container mx-auto mt-10">
      <div className="prose max-w-full text-center">
        <h1>Tenant Pricing</h1>
        <p>
          Select the plan that best suits your needs. 
        </p>
      </div>
      <div className="flex justify-end">
        <PricingMode defaultMode={freq} />
      </div>
      <Suspend>
        <TenantPlanList freq={freq} />
      </Suspend>
    </div>
  );
};

