import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import TenantApplicationWrapper from "@components/TenantApplicationWrapper";
import TenantPaymentVerification from "@components/TenantPaymentVerification";
import TenantPlanSelection from "@components/TenantPlanSelection";
import React from "react";

async function TenantsRegistrationPage(props: AppRouterPageRouteOpts) {
const { role, plan } = (props.searchParams || {}) as {role: string, plan:string } 


  return (
    <div className="container mx-auto bg-gray-50 p-5">
      <h3 className="font-bold text-teal-500 text-2xl pb-5"> Get Started as {role} with Clinic EZ</h3>
    
      <TenantApplicationWrapper>
        <TenantPlanSelection defaultPlan={plan}/>
        <TenantPaymentVerification />
        </TenantApplicationWrapper>
    </div>
  );
}

export default withPageAuthRequired(TenantsRegistrationPage);
