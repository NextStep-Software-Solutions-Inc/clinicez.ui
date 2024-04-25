import { Separator } from "@components/ui/separator"
import { PersonalInformationForm } from "@components/PersonalInformationForm"

export default function AddressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Address</h3>
        <p className="text-sm text-muted-foreground">
          Update your address to help you organization locate you.
        </p>
      </div>
      <Separator />
      <PersonalInformationForm />
    </div>
  )
}
