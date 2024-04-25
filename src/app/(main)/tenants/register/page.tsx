import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import TenantApplicationWrapper from "@components/TenantApplicationWrapper";
import TenantPaymentVerification from "@components/TenantPaymentVerification";
import TenantPlanSelection from "@components/TenantPlanSelection";

async function TenantsRegistrationPage(props: AppRouterPageRouteOpts) {
  const { role, plan, freq = "yearly" } = (props.searchParams || {}) as {role: string, plan:string, freq: string } 

  return (
    <div className="container mx-auto content mt-10">
      <div className="prose max-w-full">
        <h1>Tenant Subscription</h1>
        <p>
          Follow the steps below to complete your subscription.
        </p>
      </div>
    
      <TenantApplicationWrapper>
        <TenantPlanSelection freq={freq} defaultPlan={plan}/>
        <TenantPaymentVerification />
      </TenantApplicationWrapper>
    </div>
  );
}

export default withPageAuthRequired(TenantsRegistrationPage);
