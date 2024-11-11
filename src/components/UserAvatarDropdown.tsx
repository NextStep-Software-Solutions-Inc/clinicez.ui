"use server";

import {
  Avatar,
  AvatarFallback,
} from "@components/ui/avatar"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { SignInButton } from "./SignInButton";
import { getUserAction } from "@actions/users/user.action";
import { getCachedSession } from "@actions/session.action";
import Image from "next/image";

export default async function UserAvatarDropdown({children}: {children: React.ReactNode}) {

  const session = await getCachedSession();
  if(!session) return <SignInButton />;
  const user = await getUserAction(session.user.sub);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-10 h-10 ring-2">
          {!!user.data?.picture
            ? <Image width={50} height={50} className="object-cover" src={user.data?.picture} alt={user.data?.nickname ?? ""} /> 
            : <AvatarFallback>{user.data?.email?.substring(0,2)}</AvatarFallback>
          }
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

