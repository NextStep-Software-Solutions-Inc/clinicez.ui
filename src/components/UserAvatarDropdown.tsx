"use server";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/avatar"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { SignInButton } from "./SignInButton";
import { getUserAction } from "@actions/user.action";
import { getCachedSession } from "@actions/session.action";

export default async function UserAvatarDropdown({children}: {children: React.ReactNode}) {

  const session = await getCachedSession();
  if(!session) return <SignInButton />;
  const user = await getUserAction(session.user.sub);
  console.log("avatar dropdown user");
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-10 h-10 ring-1 ring-primary">
          <AvatarImage className="object-cover" src={user.picture ?? ""} alt={user.nickname ?? ""} />
          <AvatarFallback>{user.nickname?.substring(0,2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

