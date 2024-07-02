import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { CreditCard, LogOut, Settings } from "lucide-react";
import PHRLink from "../app/(activation)/[organization]/activate/PHRLink";
import HPProfilesLink from "./HPProfilesLink";
import DashboardLink from "./DashboardLink";
import AdminConsoleLink from "../app/(activation)/[organization]/activate/AdminConsoleLink";
import UserAvatarDropdown from "./UserAvatarDropdown";
import Suspend from "./Suspend";
import { Skeleton } from "./ui/skeleton";
import { getCachedSession } from "@actions/session.action";

export default async function UserAvatarWrapper() {
  const session = await getCachedSession();
  const userId = session?.user.sub;
  
  return (
    <UserAvatarDropdown>
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <PHRLink />
        <HPProfilesLink userId={userId}/>
        <a href="/billing">
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
              Billing
            {/* <DropdownMenuShortcut>⌘B</DropdownMenuShortcut> */}
          </DropdownMenuItem></a>
        <a href="/settings">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
              Settings
            {/* <DropdownMenuShortcut>⌘S</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </a>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <Suspend loadingFallback={<Skeleton className="h-6 mx-2 my-1 bg-slate-400" />}>
        <DashboardLink />
      </Suspend>
      <Suspend loadingFallback={<Skeleton className="h-6 mx-2 my-1 bg-slate-400" />}>
        <AdminConsoleLink />
      </Suspend>
      <DropdownMenuSeparator />
      <a href="/api/auth/logout">
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
            Log out
          {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
        </DropdownMenuItem>
      </a>
    </UserAvatarDropdown>
  );
}
