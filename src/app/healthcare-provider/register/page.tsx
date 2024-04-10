import { AppRouterPageRouteOpts, withPageAuthRequired, } from "@auth0/nextjs-auth0";
import HealthcareRoleSelector from "@components/HealthcareRoleSelector";
import PlanSelector from "@components/PlanSelector";
import StepsIndicator from "@components/StepsIndicator";
import ConditionalRender from "@components/utils/ConditionalRender";
import { Terminal } from "lucide-react"


import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@components/ui/alert"

async function HealthcareProviderRegistrationPage(props: AppRouterPageRouteOpts) {
  const { role, index, plan} = props.searchParams || {};
  const res = await fetch("http://localhost:3000/api/register/hp/step") 
  const {steps, state} = await res.json() as {
    steps: {id: number, label: string, completed: boolean}[],
    state: {
      role: string,
      plan: string,
      profile: {
        name: string,
        bio: string,
      },
    }
  };

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
            
        <StepsIndicator steps={steps} />
        <ConditionalRender condition={parseInt(index as string) === 1}>
          {/* <DisableWrapper disabled={steps.find(step => step.id === 1)?.completed}> */}
          <HealthcareRoleSelector defaultRole={role as string} roles={["doctor", "nurse", "pharmacist", "laboratory", "admin"]} />
          {/* </DisableWrapper> */}
        </ConditionalRender>
        <ConditionalRender condition={parseInt(index as string) === 2}>
          {/* <DisableWrapper disabled={steps.find(step => step.id === 2)?.completed}> */}
          <PlanSelector defaultPlan={plan as string} plans={["basic", "small", "large"]} />
          {/* </DisableWrapper> */}
        </ConditionalRender>
        <ConditionalRender condition={parseInt(index as string) === 3}>
          {/* <DisableWrapper disabled={steps.find(step => step.id === 2)?.completed}> */}
          <form className="form-control gap-2">
            <label className="input input-bordered flex items-center gap-2">
            Title
              <input type="text" className="grow" placeholder="Daisy" />
            </label>
            <label className="input input-bordered flex items-center gap-2">
            FirstName
              <input type="text" className="grow" placeholder="Daisy" />
            </label>
            
            <label className="input input-bordered flex items-center gap-2">
            Bio
              <input type="text" className="grow" placeholder="Daisy" />
            </label>
            <button className="btn mt-2" type="submit">Submit</button>
          </form>
          {/* </DisableWrapper> */}
        </ConditionalRender>
      </div>
    </div>
  );
}
export default withPageAuthRequired(HealthcareProviderRegistrationPage);