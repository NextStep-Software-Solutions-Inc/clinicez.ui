import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import TenantApplicationWrapper from "./TenantApplicationWrapper";
import TenantPaymentVerification from "./TenantPaymentVerification";
import TenantPlanSelection from "./TenantPlanSelection";
import TenantDetails from "./TenantDetails";
;

async function TenantsRegistrationPage(props: AppRouterPageRouteOpts) {
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

export default withPageAuthRequired(TenantsRegistrationPage, {
  returnTo: '/tenants/register',
});
