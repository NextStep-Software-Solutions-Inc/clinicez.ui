import Suspend from "@components/Suspend";
import React from "react";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import DoctorProfile from "./DoctorProfile";
import NurseProfile from "./NurseProfile";
import ProfileNotFound from "../../ProfileNotFound";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Provider Profile | Clinic EZ",
  description: "View the profile of a healthcare provider.",
}

export default async function PractitionerPage({params, searchParams}: AppRouterPageRouteOpts) {

  const hpId = parseInt((params?.practitioner ?? "") as string);
  const profileComponent = {
    DOCTOR: DoctorProfile,
    NURSE: NurseProfile,
  }
  const hpType = (searchParams?._type as string)?.toUpperCase() as keyof typeof profileComponent

  const Profile = profileComponent[hpType];
  if (!Profile) return <ProfileNotFound/>
  return (
    <div className="container mx-auto my-10">
      <Suspend>
        <Profile profileId={hpId} />
      </Suspend>
    </div>
  )
}
