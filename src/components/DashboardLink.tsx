
import { Container } from "lucide-react";
import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import ConditionalRender from "./utils/ConditionalRender";
import { getUserPlansAction } from "@actions/user-plan.action";
import { getSession } from "@auth0/nextjs-auth0";

export default async function DashboardLink(){
  const session = await getSession();
  if(!session) return null;
  const userPlans = await getUserPlansAction(session.user.sub);

  const isHP = userPlans.some((plan) => plan.Plan.type === "HEALTHCARE_PROVIDER" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));

  return (
    <ConditionalRender condition={isHP}>
      <a href="/org/dashboard">
        <DropdownMenuItem>
          <Container className="mr-2 h-4 w-4" />
          Dashboard
          {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
        </DropdownMenuItem>
      </a>
    </ConditionalRender>
  );
};
