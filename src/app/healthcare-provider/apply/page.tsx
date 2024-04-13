import { AppRouterPageRouteOpts, withPageAuthRequired, } from "@auth0/nextjs-auth0";
import HPRoleSelection from "@components/HPRoleSelection";
import PlanSelection from "@components/PlanSelection";
import StepsIndicator from "@components/StepsIndicator";
import { Terminal } from "lucide-react"
import steps from "@public/json/steps.json"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@components/ui/alert"
import { Metadata } from "next";
import { Tabs, TabsContent } from "@components/ui/tabs";
import HPForm from "@components/HPForm";
import PaymentForm from "@components/PaymentForm";
import { Button } from "@components/ui/button";
import ConfirmationForm from "@components/ConfirmationForm";
import Link from "next/link";
import ConditionalRender from "@components/utils/ConditionalRender";
import HPApplicationDataProvider from "../../../contexts/hp-application.context";

export const metadata: Metadata = {
  title: "Healthcare Provider Registration",
  description: "Register as a healthcare provider",
}

const roles = ["doctor", "nurse", "pharmacist", "laboratory", "admin"];
const plans = [
  {
    name: "short-term",
    price: 200,
    description: "1 year subscription",
  },
  {
    name: "long-term",
    price: 500,
    description: "3 years subscription",
  },
  {
    name: "lifetime",
    price: 1000,
    description: "Lifetime subscription",
  }
  
]
async function HealthcareProviderRegistrationPage(props: AppRouterPageRouteOpts) {
  const { role, index, plan} =( props.searchParams || {} ) as { role: string, index: string, plan: string };
  
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

        
          <ConditionalRender condition={!index}>
            <Link href={{
              query: {
                index: "role"
              }
            }} 
            >
              <Button variant="default" >Start Application</Button>
            </Link>
          </ConditionalRender>
        
          <Tabs className="" value={index}>
            <ConditionalRender condition={!!index}>
              <StepsIndicator steps={steps}/>
            </ConditionalRender>
            <TabsContent value="role">
              <HPRoleSelection defaultRole={role} roles={roles} />
            </TabsContent>
            <TabsContent value="plan">
              <PlanSelection defaultPlan={plan as string} plans={plans} />
            </TabsContent>
            <TabsContent value="profile">
              <HPForm/>
            </TabsContent>
            <TabsContent value="payment">
              <PaymentForm/>
            </TabsContent>
            <TabsContent value="confirmation">
              <ConfirmationForm/>
            </TabsContent>
          
          </Tabs>
        </div>
      </div>
    </HPApplicationDataProvider>
  );
}
export default withPageAuthRequired(HealthcareProviderRegistrationPage);