import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import TenantApplicationWrapper from "@components/TenantApplicationWrapper";
import TenantPaymentVerification from "@components/TenantPaymentVerification";
import TenantPlanSelection from "@components/TenantPlanSelection";

async function TenantsRegistrationPage(props: AppRouterPageRouteOpts) {
  const { role, plan, freq } = (props.searchParams || {}) as {role: string, plan:string, freq: string } 

  return (
    <div className="container mx-auto content">
      <div className="prose pb-10 max-w-full">
        <h2 className="text-teal-500">Tenant Subscription</h2>
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
