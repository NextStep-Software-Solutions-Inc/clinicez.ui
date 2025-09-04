import { Button } from "@components/ui/button";
import { RefreshCwOff } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "User Synchronization Error | Clinic EZ",
  description: "Oops, something went wrong while synchronizing your user account."
};

export default function UserSyncErrorPage() {
  return (
    <div className="container h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <RefreshCwOff size={90} className="w-full" />
        <h2 className="text-4xl font-bold tracking-tight">Account Sync Error</h2>
        <p className="text-sm text-muted-foreground">
          {`
            We encountered an error while synchronizing your user account.
            This may be due to the ongoing migration from Auth0 to Clerk.
            Please try signing in again or contact support if the issue persists.
          `}
        </p>
        <div className="space-y-3">
          <Link href="/sign-in" >
            <Button className="my-2 mr-2">Sign In Again</Button>
          </Link>
          <Link href="/" >
            <Button variant="outline" className="my-2">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
