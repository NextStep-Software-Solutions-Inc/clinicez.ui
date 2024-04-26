"use client"


import { useUser } from "@auth0/nextjs-auth0/client"
import { Button } from "@components/ui/button"
import Each from "@components/utils/Each"
import exp from "constants"

const mySubscriptions = [
  {
    id: "1",
    plan: "Basic",
    name: "Healthcare Provider",
    expiry: "12/12/2021",
  },
  {
    id: "2",
    plan: "Large",
    name: "Tenant Owner",
    expiry: "12/12/2021",
  }
]


export default function SubscriptionsList() {
  
  return (
    <>
      <Each
        of={mySubscriptions}
        render={subscription => (
          <div key={subscription.id} className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{subscription.name}</h3>
              <p className="text-sm text-gray-500">{subscription.plan}</p>
              <p className="text-sm text-gray-500">Expires on {subscription.expiry}</p>
            </div>
            <Button size="sm" variant="outline">Change</Button>
          </div>
        )}
      />
    </>
  )
}
