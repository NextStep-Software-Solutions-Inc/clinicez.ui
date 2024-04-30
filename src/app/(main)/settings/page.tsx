import { Separator } from "@components/ui/separator"
import { Suspense } from "react"
import GeneralSettingsForm from "./GeneralSettingsForm"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Settings | Clinic EZ",
  description: "General Settings",
};



export default function SettingsAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General</h3>
        <p className="text-sm text-muted-foreground">
            General information about your account.
        </p>
      </div>
      <Separator />
      <Suspense fallback={<div>Loading...</div>}>
        <GeneralSettingsForm />
      </Suspense>
    </div>
  )
}
