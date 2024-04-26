import { Separator } from "@components/ui/separator"
import { PersonalInformationForm } from "../PersonalInformationForm"

export default function ContactInformationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Contact Information</h3>
        <p className="text-sm text-muted-foreground">
          Update your contact information to help you organization contact you.
        </p>
      </div>
      <Separator />
      <PersonalInformationForm />
    </div>
  )
}
