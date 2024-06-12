import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import AllergiesForm from "./MedicationsForm"

export const metadata: Metadata = {
  title: "Medications | PHR",
  description: "Update your medication information for your healthcare providers to better understand your health."
}

export default function MedicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Medications</h3>
        <p className="text-sm text-muted-foreground">
          Update your medication information for your healthcare providers to better understand your health.
        </p>
      </div>
      <Separator />
      <AllergiesForm />
    </div>
  )
}
