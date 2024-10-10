import { Button } from "@components/ui/button";
import { MailWarning } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Email is taken | Clinic EZ",
  description: "You are not authorized to view this page."
};

export default function EmailIsTakenPage() {
  return (
    <div className="container h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <MailWarning size={90} className="w-full"/>
        <h2 className="text-4xl font-bold tracking-tight">Email is already taken</h2>
        <p className="text-sm text-muted-foreground">
          {`
            The email you are trying to use is already associated with an existing account.
            Please use a different email address.
          `}
        </p>
        <Link href="/">
          <Button className="my-5">Go Home</Button>
        </Link>
      </div>
     
    </div>
  )
}
