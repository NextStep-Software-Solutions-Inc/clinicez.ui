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
import Link from "next/link";
import { Button } from "./ui/button";
import Each from "./utils/Each";
import { useEffect, useState } from "react";
import { getHPsActions } from "@actions/hp.actions";

export default function UserAvatar() {

  const [hpProfiles, setHpProfiles] = useState<Awaited<ReturnType<typeof getHPsActions>>>([]);
  
  const {user, isLoading} = useUser();

  useEffect(() => {
    (async () => {
      setHpProfiles(await getHPsActions({userId: user?.sub ?? ""}))
    })()
  },[user?.sub])


  if(isLoading) return null;
  if (!user) return (
    <Link href="/api/auth/login">
      <Button className="mx-auto ~text-xs/sm ~h-8/10">Sign In</Button>
    </Link>
  )
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
          <a href={`/user/${user.sub}/phr`}>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
                Personal Health Records
              {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
            </DropdownMenuItem>
          </a>
          <Each
            of={hpProfiles}
            render={(item) => (
              <a href={`/hp/profile/${item.id}/editor?_type=${item.type}`}>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span className="capitalize">My {item.type.replaceAll("_", " ").toLowerCase()} Profile</span>
                  {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
                </DropdownMenuItem>
              </a>
            )}
            fallback={null}
          />
          <a href="/settings">
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
                Billing
              {/* <DropdownMenuShortcut>⌘B</DropdownMenuShortcut> */}
            </DropdownMenuItem></a>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
              Settings
            {/* <DropdownMenuShortcut>⌘S</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <ConditionalRender condition={isHP(user)} >
          <a  href="/org/dashboard">
            <DropdownMenuItem>
              <Container className="mr-2 h-4 w-4" />
                Dashboard
              {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
            </DropdownMenuItem>
          </a>
        </ConditionalRender>
        <ConditionalRender condition={isTenantOwner(user)}>
          <a href="https://clinic-ez-admin.vercel.app">
            <DropdownMenuItem>
              <Container className="mr-2 h-4 w-4" />
                Admin console
              {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
            </DropdownMenuItem>
          </a>
        </ConditionalRender>
        <DropdownMenuSeparator />
        <a href="/api/auth/logout">
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
              Log out
            {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
