import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import AllergiesForm from "./AllergiesForm"

export const metadata: Metadata = {
  title: "Allergies | PHR",
  description: "Update your allergy information for your healthcare providers to better understand your health."
}

export default function AllergiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Allergies</h3>
        <p className="text-sm text-muted-foreground">
          Update your allergy information for your healthcare providers to better understand your health.
        </p>
      </div>
      <Separator />
      <AllergiesForm />
    </div>
  )
}
