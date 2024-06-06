import Suspend from "@components/Suspend";
import React from "react";
import { getHPAction } from "@actions/hp.actions";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import DoctorProfile from "./DoctorProfile";
import NurseProfile from "./NurseProfile";

export default async function PractitionerPage({params}: AppRouterPageRouteOpts) {

  const profileId = parseInt((params?.practitioner ?? "") as string);
  const hp = await getHPAction(profileId);

  const type = hp?.type as keyof typeof profile;
  const doctorProfile = hp?.DoctorProfile;
  const nurseProfile = hp?.NurseProfile;

  const profile = {
    DOCTOR: <DoctorProfile profile={doctorProfile!} />,
    NURSE: <NurseProfile profile={nurseProfile!} />
  }

  return (
    <div className="container mx-auto my-10">
      <Suspend>
        {profile[type]}
      </Suspend>
    </div>
  )
}
