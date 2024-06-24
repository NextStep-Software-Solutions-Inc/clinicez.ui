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

export default async function UserAvatarDropdown({children}: {children: React.ReactNode}) {

  const session = await getSession();
  if(!session) return <SignInButton />;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-10 h-10">
          <AvatarImage src={session.user.picture ?? ""} alt={session.user.nickname ?? ""} />
          <AvatarFallback>{session.user.nickname?.substring(0,2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

