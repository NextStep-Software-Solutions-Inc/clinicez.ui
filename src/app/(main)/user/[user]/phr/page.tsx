import { Separator } from "@components/ui/separator"
import { PersonalInformationForm } from "./PersonalInformationForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Basic Information | PHR",
  description: "Update your basic information to help you identify your account in your organization."
}
export default function SettingsAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          Update your basic information to help you identify your account in your organization.
        </p>
      </div>
      <Separator />
      <PersonalInformationForm />
    </div>
  )
}
