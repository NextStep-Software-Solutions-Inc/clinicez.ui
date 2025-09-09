"use client";

import { useUser } from "@auth0/nextjs-auth0";
import { Button } from "@components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AvatarDropdown() {
  const { isLoading, user } = useUser();
  if (isLoading) return <Loader2Icon className="w-5 h-5 animate-spin" />
  if (!user) return <SignInButton />
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
            width={10}
            height={10}
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
          <Link href="/auth/logout" onClick={() => localStorage.clear()}>
            Logout
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


const SignInButton = () => {
  return (
    <a href="/auth/login" title="" className="px-5 py-2.5 text-base transition-all duration-200 hover:bg-teal-400 hover:text-white focus:text-white focus:bg-teal-400 font-semibold text-white bg-teal-600 rounded-lg" role="button"> Sign In</a>
  )
}