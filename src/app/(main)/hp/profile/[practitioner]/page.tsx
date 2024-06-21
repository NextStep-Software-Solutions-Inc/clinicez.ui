import Suspend from "@components/Suspend";
import React from "react";
import { AppRouterPageRouteOpts, getSession } from "@auth0/nextjs-auth0";
import dynamic from "next/dynamic";
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
  DOCTOR: dynamic(() => import("./DoctorProfile")),
  NURSE: dynamic(() => import("./NurseProfile")),
}

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const hpId = parseInt((params?.practitioner ?? "") as string);  
  const hpType = (searchParams?._type as string)?.toUpperCase() as keyof typeof profileComponent
  const action = { DOCTOR: getDoctorAction, NURSE: getNurseAction }[hpType];

  const profile = await action?.(hpId)
  if(!profile) return notFound();

  const site = new URL(process.env.AUTH0_BASE_URL ?? "").hostname;
  const title = `${profile.title} ${profile.name} ${profile.suffix} | ${profile.fields.join(", ")}`;
  const description = profile.philosophy ?? "";
  const image = profile.picture ?? "";

  const ogURL = `https://ogcdn.net/e4b8c678-7bd5-445d-ba03-bfaad510c686/v4/${encodeURIComponent(site)}/${encodeURIComponent(title)}/${encodeURIComponent(image)}/og.png`;

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title,
    description,
    openGraph: {
      images: [ogURL, ...previousImages],
    },
  };
}

export default async function PractitionerPage({params, searchParams}: AppRouterPageRouteOpts) {

  const hpId = parseInt((params?.practitioner ?? "") as string);
  const session = await getSession()
  const myHp = await getHPAction({
    userId: session?.user.sub
  })
 
  const hpType = (searchParams?._type as string)?.toUpperCase() as keyof typeof profileComponent

  const Profile = profileComponent[hpType] || ProfileNotFound;
  
  return (
    <div className="content container mx-auto my-10 relative">
      <ConditionalRender condition={myHp?.id === hpId}>
        <Link href={`/hp/profile/${hpId}/editor?_type=${hpType}`}>
          <Button className="z-10 fixed -right-[6.5rem] mr-2 hover:-right-[20px] transition-all">
            <Pencil size={20} className="mr-2"/>Edit profile
          </Button>
        </Link>
      </ConditionalRender>
      <Suspend>
        <Profile profileId={hpId} />
      </Suspend>
    </div>
  )
}


