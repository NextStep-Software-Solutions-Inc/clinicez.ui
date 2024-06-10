

import { AppRouterPageRouteOpts, getSession, withPageAuthRequired, } from "@auth0/nextjs-auth0";

import SelectHPType from "./components/SelectHPType";
import SelectPlan from "./components/SelectPlan";
import PaymentForm from "./components/PaymentForm";
import ConfirmationForm from "./components/ConfirmationForm";

import { Metadata } from "next";
import HPApplicationDataProvider from "@contexts/hp-application.context";
import ApplicationForm from "./components/ApplicationForm";
import React from "react";
import { getHPAction } from "@actions/hp.actions";

export const metadata: Metadata = {
  title: "Healthcare Provider Registration",
  description: "Register as a healthcare provider",
}


async function HealthcareProviderRegistrationPage(props: AppRouterPageRouteOpts) {
  const session = await getSession();
  
  const hp = await getHPAction({userId: session?.user.sub});
  
  return (
    <HPApplicationDataProvider>
      <div className="container mx-auto my-10">
        <div className="prose max-w-full">
          <h1>Healthcare Provider Application Process</h1>
          <p>
            Thank you for your interest in joining our network of healthcare providers! This online application process will
            guide you through the steps of becoming a Clinic EZ provider.
          </p>
        </div>
        <ApplicationForm currentStep={1} >
          <SelectHPType {
            ...(hp?.type ? { activeRole: [hp.type] } : {})
          }/>
          <SelectPlan/>
          <PaymentForm />
          <ConfirmationForm />
        </ApplicationForm>
      </div>
    </HPApplicationDataProvider>
  );
}
export default withPageAuthRequired(HealthcareProviderRegistrationPage, {
  returnTo: '/hp/apply',
});