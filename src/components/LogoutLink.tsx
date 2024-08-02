"use client";

import { DropdownMenuItem } from "@components/ui/dropdown-menu"
import { LogOut } from "lucide-react";

export default function LogoutLink(){
  return (
    <a href="/api/auth/logout" onClick={() => localStorage.clear()}>
      <DropdownMenuItem>
        <LogOut className="mr-2 h-4 w-4" />
            Log out
      </DropdownMenuItem>
    </a>
  )
}