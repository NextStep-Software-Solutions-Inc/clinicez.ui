import { Separator } from "@components/ui/separator"
import { PersonalInformationForm } from "../PersonalInformationForm"

export default function DisabilitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Disabilities</h3>
        <p className="text-sm text-muted-foreground">
          Update your disability information to help you organization track your disability history.
        </p>
      </div>
      <Separator />
      <PersonalInformationForm />
    </div>
  )
}
