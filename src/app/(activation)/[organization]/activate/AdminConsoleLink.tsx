import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import { Container } from "lucide-react";
import ConditionalRender from "@components/utils/ConditionalRender";
import { isTenant } from "@lib/protect-org";

export default async function AdminConsoleLink() {
  const tenant = await isTenant();
  return (
    <ConditionalRender condition={tenant}>
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
