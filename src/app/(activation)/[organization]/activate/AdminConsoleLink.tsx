import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import { Container } from "lucide-react";
import ConditionalRender from "@components/utils/ConditionalRender";
import { getUserPlansAction } from "@actions/user-plan.action";
import { getCachedSession } from "@actions/session.action";

export default async function AdminConsoleLink() {
  const session = await getCachedSession();
  if(!session) return null;
  const userPlans = await getUserPlansAction(session.user.sub);

  const isTenant = userPlans.some((plan) => plan.Plan.type === "TENANT" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));
  
  return (
    <ConditionalRender condition={isTenant}>
      <a href="https://clinic-ez-admin.vercel.app">
        <DropdownMenuItem>
          <Container className="mr-2 h-4 w-4" />
          Admin console
          {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
        </DropdownMenuItem>
      </a>
    </ConditionalRender>
  );
};
