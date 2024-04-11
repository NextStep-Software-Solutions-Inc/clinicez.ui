import { AppRouterPageRouteOpts, withPageAuthRequired, } from "@auth0/nextjs-auth0";
import HealthcareRoleSelector from "@components/HealthcareRoleSelector";
import PlanSelector from "@components/PlanSelector";
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

export const metadata: Metadata = {
  title: "Healthcare Provider Registration",
  description: "Register as a healthcare provider",
}

async function HealthcareProviderRegistrationPage(props: AppRouterPageRouteOpts) {
  const { role, index, plan} =( props.searchParams || {} ) as { role: string, index: string, plan: string };
  
  return (
    <div className="container mx=auto">
      {/* add alert here to show the the user has already submitted and waiting for approval */}
      <Alert className="mb-5">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
        Your registration is pending approval.
        </AlertDescription>
      </Alert>
        
      <div className="prose max-w-full">
        <h2>Healthcare Provider Registration</h2>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum nesciunt enim voluptas ratione, magnam quas ea atque odit aspernatur perspiciatis tenetur, iusto provident veritatis temporibus facere totam alias officia veniam.</p>
        
        <Tabs className="" defaultValue={index}>
          <StepsIndicator steps={steps} />
          <TabsContent value="role">
            <HealthcareRoleSelector defaultRole={role} roles={["doctor", "nurse", "pharmacist", "laboratory", "admin"]} />
          </TabsContent>
          <TabsContent value="plan">
            <PlanSelector defaultPlan={plan as string} plans={["basic", "small", "large"]} />
          </TabsContent>
          <TabsContent value="profile">
            <HPForm/>
          </TabsContent>
          <TabsContent value="payment">
            <PaymentForm/>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
export default withPageAuthRequired(HealthcareProviderRegistrationPage);