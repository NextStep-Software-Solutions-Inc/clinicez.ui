import Suspend from "@components/Suspend";
import PractitionerProfile from "./PractitionerProfile";
import React from "react";
import { getHPAction } from "@actions/hp.actions";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";

export default async function PractitionerPage({params}: AppRouterPageRouteOpts) {

  const profileId = params?.practitioner as string;
  const hp = await getHPAction(profileId);

  return (
    <div className="container mx-auto my-10">
      <Suspend>
        <PractitionerProfile profile={hp}/>
      </Suspend>
    </div>
  )
}
