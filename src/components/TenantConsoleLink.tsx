import { Container } from "lucide-react";
import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import ConditionalRender from "./utils/ConditionalRender";
import { isTenant } from "@lib/protect-org";

export default async function TenantConsoleLink(){
  const tenant = await isTenant();
  
  return (
    <ConditionalRender condition={tenant}>
      <a href={`/console/tenant`}>
        <DropdownMenuItem>
          <Container className="mr-2 h-4 w-4" />
          Tenant Console
        </DropdownMenuItem>
      </a>
    </ConditionalRender>
  );
};
