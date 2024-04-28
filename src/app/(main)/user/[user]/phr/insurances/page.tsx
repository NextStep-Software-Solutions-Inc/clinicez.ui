import { Separator } from "@components/ui/separator"
import { PersonalInformationForm } from "../PersonalInformationForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Insurances & HMOs | PHR",
  description: "Update your insurance information to help you organization track your insurance affiliations."
}

export default function InsurancesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Insurances and HMOs</h3>
        <p className="text-sm text-muted-foreground">
          Update your insurance information to help you organization track your insurance affiliations.
        </p>
      </div>
      <Separator />
      <PersonalInformationForm />
    </div>
  )
}
