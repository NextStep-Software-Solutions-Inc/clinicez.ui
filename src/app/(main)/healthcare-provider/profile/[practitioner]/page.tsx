import Suspend from "@components/Suspend";
import React from "react";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import DoctorProfile from "./DoctorProfile";
import NurseProfile from "./NurseProfile";
import ProfileNotFound from "../../ProfileNotFound";
import { Metadata, ResolvingMetadata } from "next";
import { getDoctorAction } from "@actions/doctor.action";
import { getNurseAction } from "@actions/nurse.action";

type Props = {
  params: { practitioner: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

const profileComponent = {
  DOCTOR: DoctorProfile,
  NURSE: NurseProfile,
}

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const hpId = parseInt((params?.practitioner ?? "") as string);  
  const hpType = (searchParams?._type as string)?.toUpperCase() as keyof typeof profileComponent
  const action = {
    DOCTOR: getDoctorAction,
    NURSE: getNurseAction,
  }[hpType]

  // fetch data
  const profile = await action(hpId)

  const site = process.env.AUTH0_BASE_URL?.split("//").pop() ?? ""
  const title = `${profile?.title} ${profile?.name} ${profile?.suffix} | ${profile?.fields.join(", ")}`
  const description = profile?.philosophy ?? ""
  const image = profile?.picture ?? ""

  const encoded_site = encodeURI(site)
  const encoded_title = encodeURI(title)
  const encoded_image = encodeURIComponent(image)

  // replace ogURL with actual values
  const ogURL = `https://ogcdn.net/e4b8c678-7bd5-445d-ba03-bfaad510c686/v4/${encoded_site}/${encoded_title}/${encoded_image}/og.png`
  
  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || []
  
 
  return {
    title: title,
    description: description,
    openGraph: {
      images: [ogURL, ...previousImages],
    },
  }
}

export default async function PractitionerPage({params, searchParams}: AppRouterPageRouteOpts) {

  const hpId = parseInt((params?.practitioner ?? "") as string);
 
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
