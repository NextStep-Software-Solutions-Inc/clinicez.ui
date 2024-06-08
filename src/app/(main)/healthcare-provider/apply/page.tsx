

import { AppRouterPageRouteOpts, getAccessToken, getSession, updateSession, withPageAuthRequired, } from "@auth0/nextjs-auth0";
import { Terminal } from "lucide-react"

import SelectHPType from "./SelectHPType";
import SelectPlan from "./SelectPlan";
import PaymentForm from "./PaymentForm";
import ConfirmationForm from "./ConfirmationForm";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@components/ui/alert"
import { Metadata } from "next";
import { Button } from "@components/ui/button";
import HPApplicationDataProvider from "@contexts/hp-application.context";
import ApplicationForm from "./ApplicationForm";
import React from "react";
import { getHPAction } from "@actions/hp.actions";

export const metadata: Metadata = {
  title: "Healthcare Provider Registration",
  description: "Register as a healthcare provider",
}


async function HealthcareProviderRegistrationPage(props: AppRouterPageRouteOpts) {
  const session = await getSession();
  await updateSession({
    ...session,
    user: {
      ...session?.user,
      metadata: {
        role: "healthcare-provider"
      }
    }
  });

  console.log({session});
  
  const hp = await getHPAction({userId: session?.user.sub});
  
  return (
    <HPApplicationDataProvider>
      <div className="container mx-auto my-10">
        {/* add alert here to show the the user has already submitted and waiting for approval */}
        <Alert className="mb-5">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription className="flex justify-between">
            <span>You have already submitted your application and are waiting for approval.</span>
            <Button size={"sm"} variant="ghost">Cancel</Button>
          </AlertDescription>
        </Alert>
        
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
  returnTo: '/healthcare-provider/apply',
});