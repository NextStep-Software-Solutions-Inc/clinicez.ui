import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import InsurancesForm from "./InsurancesForm"

export const metadata: Metadata = {
  title: "Insurances & HMOs | PHR",
  description: "Keep your insurance and HMO information up to date to help for easy access when needed."
}

export default function InsurancesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Insurances and HMOs</h3>
        <p className="text-sm text-muted-foreground">
          Keep your insurance and HMO information up to date to help for easy access when needed.
        </p>
      </div>
      <Separator />
      <InsurancesForm />
    </div>
  )
}
