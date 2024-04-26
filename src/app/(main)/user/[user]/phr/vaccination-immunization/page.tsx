import { Separator } from "@components/ui/separator"
import { PersonalInformationForm } from "../PersonalInformationForm"

export default function VaccinationImmunizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Vaccination & Immunization</h3>
        <p className="text-sm text-muted-foreground">
          Update your vaccination and immunization information to help you organization track your vaccination and immunization history.
        </p>
      </div>
      <Separator />
      <PersonalInformationForm />
    </div>
  )
}
