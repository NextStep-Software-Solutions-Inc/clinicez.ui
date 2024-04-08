import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import React from "react";

async function TenantsRegistrationPage(props: AppRouterPageRouteOpts) {
  const { role, plan } = props.searchParams || {}

  return (
    <div className="container mx-auto">
        <div className="prose">
            <h3>Tenants Registration Page</h3>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, quod cumque, quibusdam ipsam dicta, autem natus sequi quisquam ut odio delectus aut itaque quis ea aliquid magni quaerat. Ipsum, sed!</p>
            <p>Role: {role}</p>
            <p>Plan: {plan}</p>
        </div>
    </div>
  );
}
export default withPageAuthRequired(TenantsRegistrationPage);
