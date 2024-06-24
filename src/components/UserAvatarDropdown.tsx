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
import { getSession } from "@auth0/nextjs-auth0";
import { getUserAction } from "@actions/user.action";

export default async function UserAvatarDropdown({children}: {children: React.ReactNode}) {

  const session = await getSession();
  if(!session) return <SignInButton />;
  const user = await getUserAction(session.user.sub);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.picture ?? ""} alt={user.nickname ?? ""} />
          <AvatarFallback>{user.nickname?.substring(0,2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

