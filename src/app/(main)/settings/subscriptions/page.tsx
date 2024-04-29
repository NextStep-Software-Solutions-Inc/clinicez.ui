import { Separator } from "@components/ui/separator";
import React from "react";
import SubscriptionsList from "./SubscriptionsList";


export default function SubscriptionsPage() {
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Subscriptions</h3>
        <p className="text-sm text-muted-foreground">
          List of subscriptions for your account.
        </p>
      </div>
      <Separator />
      <SubscriptionsList />
    </div>
  )
}
