import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import TenantApplicationWrapper from "./TenantApplicationWrapper";
import TenantPaymentVerification from "./TenantPaymentVerification";
import TenantPlanSelection from "./TenantPlanSelection";

async function TenantsRegistrationPage(props: AppRouterPageRouteOpts) {
  const { role, plan, freq = "yearly" } = (props.searchParams || {}) as {role: string, plan:string, freq: string } 

  return (
    <div className="container mx-auto content mt-10">
      <div className="prose max-w-full text-center">
        <h1>Tenant Subscription</h1>
        <p>
          Follow the steps below to complete your subscription.
        </p>TenantApplicationWrapper
      </div>
    
      <TenantApplicationWrapper>
        <TenantPlanSelection freq={freq} defaultPlan={plan}/>
        <TenantPaymentVerification />
      </TenantApplicationWrapper>
    </div>
  );
}

export default withPageAuthRequired(TenantsRegistrationPage, {
  returnTo: '/tenants/register',
});
