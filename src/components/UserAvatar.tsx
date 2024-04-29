"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/avatar"

import {
  CreditCard,
  LogOut,
  Settings,
  User,
  Container
} from "lucide-react"
 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { useUser } from "@auth0/nextjs-auth0/client";
import ConditionalRender from "./utils/ConditionalRender";
import { isHP, isTenantOwner } from "@lib/rbac.helper";

export default function UserAvatar() {

  const {user, isLoading} = useUser();

  if(isLoading) return null;
  if (!user) return <a href="/api/auth/login" title="" className="px-5 py-2.5 text-base transition-all duration-200 hover:bg-teal-400 hover:text-white focus:text-white focus:bg-teal-400 font-semibold text-white bg-teal-600 rounded-lg" role="button"> Sign In</a>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.picture ?? ""} alt={user.nickname ?? ""} />
          <AvatarFallback>{user.nickname?.substring(0,2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <a href={`/user/${user.sub?.split("|")[1]}/phr`}>Personal Health Records</a>
            {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <a href="/billing">Billing</a>
            {/* <DropdownMenuShortcut>⌘B</DropdownMenuShortcut> */}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <a href="/settings">Settings</a>
            {/* <DropdownMenuShortcut>⌘S</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <ConditionalRender condition={isHP(user)} >
          <DropdownMenuItem>
            <Container className="mr-2 h-4 w-4" />
            <a href="/org/dashboard">Dashboard</a>
            {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </ConditionalRender>
        <ConditionalRender condition={isTenantOwner(user)}>
          <DropdownMenuItem>
            <Container className="mr-2 h-4 w-4" />
            <a href="https://clinic-ez-admin.vercel.app">Admin console</a>
            {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </ConditionalRender>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <a href="/api/auth/logout">Log out</a>
          {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
