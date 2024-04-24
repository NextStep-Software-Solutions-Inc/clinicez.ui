

import { AppRouterPageRouteOpts, withPageAuthRequired, } from "@auth0/nextjs-auth0";
import { Terminal } from "lucide-react"

import HPRoleSelection from "@components/HPRoleSelection";
import PlanSelection from "@components/PlanSelection";
import PaymentForm from "@components/PaymentForm";
import ConfirmationForm from "@components/ConfirmationForm";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@components/ui/alert"
import { Metadata } from "next";
import { Tabs, TabsContent } from "@components/ui/tabs";
import { Button } from "@components/ui/button";
import HPApplicationDataProvider from "@contexts/hp-application.context";
import ApplicationForm from "@components/ApplicationForm";
import HPForm from "@components/HPForm";

export const metadata: Metadata = {
  title: "Healthcare Provider Registration",
  description: "Register as a healthcare provider",
}


async function HealthcareProviderRegistrationPage(props: AppRouterPageRouteOpts) {
  const { role, index = "1"} =( props.searchParams || {} ) as { role: string, index: string };
  
  return (
    <HPApplicationDataProvider>
      <div className="container mx=auto">
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
          <h1>Welcome to the Clinic EZ Healthcare Provider Application Process</h1>
          <p>
            Thank you for your interest in joining our network of healthcare providers! This online application process will
            guide you through the steps of becoming a Clinic EZ provider.
          </p>
        </div>
        <ApplicationForm currentStep={1}>
          <HPRoleSelection />
          <PlanSelection/>
          <HPForm/>
          <PaymentForm />
          <ConfirmationForm />
        </ApplicationForm>
      </div>
    </HPApplicationDataProvider>
  );
}
export default withPageAuthRequired(HealthcareProviderRegistrationPage);