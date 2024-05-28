

import { AppRouterPageRouteOpts, withPageAuthRequired, } from "@auth0/nextjs-auth0";
import { Terminal } from "lucide-react"

import HPRoleSelection from "./HPRoleSelection";
import PlanSelection from "./PlanSelection";
import PaymentForm from "./PaymentForm";
import ConfirmationForm from "./ConfirmationForm";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@components/ui/alert"
import { Metadata } from "next";
import { Tabs, TabsContent } from "@components/ui/tabs";
import { Button } from "@components/ui/button";
import HPApplicationDataProvider from "@contexts/hp-application.context";
import ApplicationForm from "./ApplicationForm";
import HPForm from "./HPForm";

export const metadata: Metadata = {
  title: "Healthcare Provider Registration",
  description: "Register as a healthcare provider",
}


async function HealthcareProviderRegistrationPage(props: AppRouterPageRouteOpts) {
  const { role, index = "1"} =( props.searchParams || {} ) as { role: string, index: string };
  
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
          <h1>Healthcare Provider Application</h1>
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
export default withPageAuthRequired(HealthcareProviderRegistrationPage, {
  returnTo: '/healthcare-provider/apply',
});