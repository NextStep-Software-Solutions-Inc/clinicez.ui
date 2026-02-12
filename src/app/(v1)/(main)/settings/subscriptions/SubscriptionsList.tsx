import { getUserPlansAction } from "@actions/users/user-plan.action"
import Each from "@components/utils/Each"
import { format, formatDistanceToNow } from "date-fns"
import { ChangePlan } from "./ChangePlan"

interface SubscriptionsListProps {
  userId: string
}

export default async function SubscriptionsList({userId}:SubscriptionsListProps) {
  const myPlans = await getUserPlansAction(userId)
  
  return (
    <>
      <Each
        of={myPlans.filter(plan => plan.status === "ACTIVE")}
        render={subscription => (
          <div key={subscription.id} className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold capitalize">{subscription.Plan.type.split("_").map(t => t.toLowerCase()).join(" ")}</h3>
              <p className="text-sm text-gray-500">{subscription.Plan.name}</p>
              <p className="text-sm text-gray-500">Expires {formatDistanceToNow(subscription.endDate, {
                addSuffix: true
              })} on {format(subscription.endDate, "P")} - </p>
            </div>
            <ChangePlan/>
          </div>
        )}
      />
    </>
  )
}
