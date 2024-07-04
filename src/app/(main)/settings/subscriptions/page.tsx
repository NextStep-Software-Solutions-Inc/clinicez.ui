import { Separator } from "@components/ui/separator";
import React from "react";
import SubscriptionsList from "./SubscriptionsList";
import { Metadata } from "next";
import { getCachedSession } from "@actions/session.action";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export const metadata: Metadata = {
  title: "Subscriptions | Clinic EZ",
  description: "List of subscriptions for your account.",
};

async function SubscriptionsPage() {
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
      <SubscriptionsList userId={userId} />
    </div>
  )
}

export default withPageAuthRequired(SubscriptionsPage);