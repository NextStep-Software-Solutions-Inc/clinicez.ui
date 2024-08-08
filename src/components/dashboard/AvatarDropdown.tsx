"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "@components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AvatarDropdown() {
  const {isLoading, user} = useUser();
  
  if (isLoading) return null;
  if (!user) return <a href="/api/auth/login" title="" className="px-5 py-2.5 text-base transition-all duration-200 hover:bg-teal-400 hover:text-white focus:text-white focus:bg-teal-400 font-semibold text-white bg-teal-600 rounded-lg" role="button"> Sign In</a>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <Image
            src={user?.picture ?? ""}
            width={36}
            height={36}
            alt="Avatar"
            className="overflow-hidden rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/settings">
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/dashboard/support">
            Support
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/api/auth/logout" onClick={() => localStorage.clear()}>
            Logout
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
