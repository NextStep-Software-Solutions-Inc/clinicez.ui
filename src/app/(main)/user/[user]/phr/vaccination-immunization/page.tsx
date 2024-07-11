import { Separator } from "@components/ui/separator"
import { Metadata } from "next"
import Suspend from "@components/Suspend"
import Vaccinations from "./Vaccinations"
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"

export const metadata: Metadata = {
  title: "Vaccination & Immunization | PHR",
  description: "Update your vaccination and immunization information to help you organization track your vaccination and immunization history."
}

async function VaccinationImmunizationPage({params}: AppRouterPageRouteOpts) {
  const userId = decodeURI(params?.user as string)
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Vaccination & Immunization</h3>
        <p className="text-sm text-muted-foreground">
          Enter your vaccination and immunization records to help you organization track your vaccination and immunization history.
        </p>
      </div>
      <Separator />
      <Suspend>
        <Vaccinations userId={userId}/>
      </Suspend>
    </div>
  )
}

export default withPageAuthRequired(VaccinationImmunizationPage, {})