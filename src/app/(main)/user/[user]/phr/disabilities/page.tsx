import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import DisabilitiesForm from "./DisabilitiesForm"
import IllnessesForm from "./IllnessForm"

export const metadata: Metadata = {
  title: "Disabilities | PHR",
  description: "Update your disabilities and illnesses information to help your organization track your health history."
}

export default function DisabilitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Disabilities and Illnesses</h3>
        <p className="text-sm text-muted-foreground">
          Update your disabilities and illnesses information to help your organization track your health history.
        </p>
      </div>
      <Separator />
      <DisabilitiesForm />
      <IllnessesForm />
    </div>
  )
}
