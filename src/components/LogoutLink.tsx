"use client";

import React from "react";
import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

export default function LogoutLink() {
  const { signOut } = useAuth();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.clear();
      await signOut();
    } catch (err) {
      console.error('Sign out failed', err);
      // fallback to legacy path
      window.location.href = '/auth/logout';
    }
  };

  return (
    <a href="/auth/logout" onClick={handleSignOut}>
      <DropdownMenuItem>
        <LogOut className="mr-2 h-4 w-4" />
        Log out
      </DropdownMenuItem>
    </a>
  );
}
