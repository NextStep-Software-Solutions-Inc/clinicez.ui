import Suspend from "@components/Suspend";
import React from "react";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import dynamic from "next/dynamic";
import ProfileNotFound from "../../ProfileNotFound";
import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { Button } from "@components/ui/button";
import { Pencil } from "lucide-react";
import { getHPAction } from "@actions/hp.actions";
import ConditionalRender from "@components/utils/ConditionalRender";
import { notFound } from "next/navigation";
import { getCachedSession } from "@actions/session.action";
import HPProfile from "./HPProfile";

type Props = {
  params: { practitioner: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const hpId = parseInt((params?.practitioner ?? "") as string);  
  const profile = await getHPAction({
    isPublished: true,
    id: hpId
  })
  if(!profile) return notFound();

  const site = new URL(process.env.AUTH0_BASE_URL ?? "").hostname;
  const title = `${profile.HPProfile?.title} ${profile.HPProfile?.name} ${profile.HPProfile?.suffix} | ${profile.HPProfile?.fields.join(", ")}`;
  const description = profile.HPProfile?.philosophy ?? "";
  const image = profile.HPProfile?.picture ?? "";

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
  const session = await getCachedSession()
  const myHp = await getHPAction({
    userId: session?.user.sub
  })
 
  const Profile = HPProfile || ProfileNotFound;
  
  return (
    <div className="content container mx-auto my-10 relative">
      <ConditionalRender condition={myHp?.id === hpId}>
        <Link href={`/hp/profile/${hpId}/editor`}>
          <Button className="z-10 fixed -right-[6.5rem] mr-2 hover:-right-[20px] transition-all">
            <Pencil size={20} className="mr-2"/>Edit profile
          </Button>
        </Link>
      </ConditionalRender>
      <Suspend>
        <Profile hpId={hpId} />
      </Suspend>
    </div>
  )
}


