import TenantApplicationWrapper from "./TenantApplicationWrapper";
import TenantPaymentVerification from "./TenantPaymentVerification";
import TenantPlanSelection from "./TenantPlanSelection";
import TenantDetails from "./TenantDetails";
import { AppRouterPageRouteOpts } from "@/types";

export default async function TenantsRegistrationPage(props: AppRouterPageRouteOpts) {
  const {freq = "YEARLY" } = (props.searchParams || {}) as { freq: "MONTHLY" | "YEARLY" } 

  return (
    <div className="container mx-auto content my-10">
      <div className="prose max-w-full text-center">
        <h1>Tenant Subscription</h1>
        <p>
          Follow the steps below to complete your subscription.
        </p>
      </div>
      <TenantApplicationWrapper>
        <TenantPlanSelection freq={freq}/>
        <TenantPaymentVerification />
        <TenantDetails />
      </TenantApplicationWrapper>
    </div>
  );
}