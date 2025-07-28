import { Separator } from "@components/ui/separator";
import React from "react";
import SubscriptionsList from "./SubscriptionsList";
import { Metadata } from "next";
import { getCachedSession } from "@actions/session.action";

export const metadata: Metadata = {
  title: "Subscriptions | Account Settings",
  description: "List of subscriptions for your account.",
};

export default async function SubscriptionsPage() {
  const session = await getCachedSession();
  const userId = session?.user.sub;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Subscriptions</h3>
        <p className="text-sm text-muted-foreground">
          List of subscriptions for your account.
        </p>
      </div>
      <Separator />
      {userId && <SubscriptionsList userId={userId} />}
    </div>
  )
}