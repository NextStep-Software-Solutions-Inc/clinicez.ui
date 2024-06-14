import Suspend from "@components/Suspend";
import React from "react";
import { AppRouterPageRouteOpts, getSession } from "@auth0/nextjs-auth0";
import DoctorProfile from "./DoctorProfile";
import NurseProfile from "./NurseProfile";
import ProfileNotFound from "../../ProfileNotFound";
import { Metadata, ResolvingMetadata } from "next";
import { getDoctorAction } from "@actions/doctor.action";
import { getNurseAction } from "@actions/nurse.action";
import Link from "next/link";
import { Button } from "@components/ui/button";
import { Pencil } from "lucide-react";
import { getHPAction } from "@actions/hp.actions";
import ConditionalRender from "@components/utils/ConditionalRender";
import { notFound } from "next/navigation";

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
  if(!profile) return notFound()

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
  const session = await getSession()
  const myHp = await getHPAction({
    userId: session?.user.sub
  })
 
  const hpType = (searchParams?._type as string)?.toUpperCase() as keyof typeof profileComponent

  const Profile = profileComponent[hpType];

  if (!Profile) return <ProfileNotFound/>
  return (
    <div className="content container mx-auto my-10 relative">
      <ConditionalRender condition={myHp?.id === hpId}>
        <div className="flex">
          <Link href={`/hp/profile/${hpId}/editor?_type=${hpType}`}>
            <Button className="z-10 fixed -right-[6.5rem] mr-2 hover:-right-[20px] transition-all"><Pencil size={20} className="mr-2"/>Edit profile</Button>
          </Link>
        </div>
      </ConditionalRender>
      <Suspend>
        <Profile profileId={hpId} />
      </Suspend>
    </div>
  )
}


