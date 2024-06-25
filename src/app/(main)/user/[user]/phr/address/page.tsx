import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import AddressFormForm from "./AddressForm"
import UnderConstruction from "@components/UnderConstruction"

export const metadata: Metadata = {
  title: "Address | PHR",
  description: "Update your address to help you organization locate you."
}

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
      <UnderConstruction/>

      {/* <AddressFormForm /> */}
    </div>
  )
}
