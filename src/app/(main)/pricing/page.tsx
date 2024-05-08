import Link from "next/link";
import PricingMode from "@components/PricingMode";
import Each from "@components/utils/Each";
import { getTenantPlanPackage } from "./plans.request";
import { Metadata } from "next";
import PricingList from "./PricingList";
import Suspend from "@components/Suspend";

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
      <Suspend>
        <PricingList freq={freq} />
      </Suspend>
    </div>
  );
};

