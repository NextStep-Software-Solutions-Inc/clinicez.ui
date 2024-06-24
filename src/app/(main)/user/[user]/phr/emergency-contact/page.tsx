import { Separator } from "@components/ui/separator"
import EmergencyContactForm from "./EmergencyContactForm"
import { Metadata } from "next"
import UnderConstruction from "@components/UnderConstruction"

export const metadata: Metadata = {
  title: "Emergency Contact | PHR",
  description: "Update your emergency contact information to help you in case of emergency."
}

export default function ContactInformationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Emergency Contact</h3>
        <p className="text-sm text-muted-foreground">
          Update your emergency contact information to help you in case of emergency.
        </p>
      </div>
      <Separator />
      <UnderConstruction/>
      {/* <EmergencyContactForm /> */}
    </div>
  )
}
