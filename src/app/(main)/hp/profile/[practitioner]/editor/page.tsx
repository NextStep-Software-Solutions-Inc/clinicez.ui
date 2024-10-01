import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";

import HPProfileForm from "./components/HPProfileForm";
import HPProfessionalInfo from "./components/HPProfessionalInfo";
import { HPProfileType } from "./hp-form.schema";
import Suspend from "@components/Suspend";
import { getHPAction, getHPsAction, getProfessionalDetailsAction, setIsPublishAction } from "@actions/hp.actions";
import HPPhoto from "./components/HPPhoto";
import { Button } from "@components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import ActionButton from "@components/ActionButton";
import { notFound, redirect } from "next/navigation";
import { HealthcareProviderType } from "@prisma/common/client";
import { getCachedSession } from "@actions/session.action";

async function EditorPage({params, searchParams}: AppRouterPageRouteOpts) {
  const hpId = parseInt(params?.practitioner as string);
  const type = searchParams?._type as HealthcareProviderType;

  const session = await getCachedSession();
  const userId = session?.user.sub
  if(!userId) return redirect("/api/auth/login");
  
  const myHps = await getHPsAction({ userId });
  const isMyHp = myHps.some((hp) => hp.id === hpId);
  if(!isMyHp) return notFound();

  const hp = await getHPAction({
    id: hpId,
  });
  
  const mappedProfile: HPProfileType = {
    id: hp?.HPProfile?.id ?? 0,
    title: hp?.HPProfile?.title ?? "",
    name: hp?.HPProfile?.name ?? "",
    suffix: hp?.HPProfile?.suffix ?? "",
    workEmail: hp?.HPProfile?.workEmail ?? "",
    workPhone: hp?.HPProfile?.workPhone ?? "",
    philosophy: hp?.HPProfile?.philosophy ?? "",
    areaOfInterest: hp?.HPProfile?.areaOfInterest ?? "",
    experience: hp?.HPProfile?.experience ?? "",
    languages: hp?.HPProfile?.languages.map((lang) => ({name: lang})) ?? [],
    specialties: hp?.HPProfile?.specialties.map((specialty) => ({name: specialty})) ?? [],
    educations: hp?.HPProfile?.educations.map((education) => ({name: education})) ?? [],
    certifications: hp?.HPProfile?.certifications.map((certification) => ({name: certification})) ?? [],
    fields: hp?.HPProfile?.fields.map((field) => ({name: field})) ?? [],
    affiliations: hp?.HPProfile?.affiliations.map((affiliation) => ({name: affiliation})) ?? [],
  }

  const professionalDetails = await getProfessionalDetailsAction(hpId);

  const isPublished = hp?.isPublished;
  const handleTogglePublish = async () => {
    "use server"
    await setIsPublishAction(hpId, !isPublished);
    revalidatePath(`/hp/profile/${hpId}`,  "page");
  }

  return (
    <div className="container mx-auto my-10 relative">
      <div className="prose max-w-full mb-5">
        <div className="flex">
          <h1 className="capitalize flex-1">{hp?.type.replaceAll("_", " ").toLowerCase()} Profile Editor</h1>
          <form action={handleTogglePublish}>
            <ActionButton variant={isPublished? "destructive": "default"}>{isPublished ? "Unpublish": "Publish"}</ActionButton>
          </form>
          <Link href={`/hp/profile/${hpId}`}>
            <Button className="fixed top-44 -right-[7rem] mr-2 hover:-right-[20px] transition-all"><ExternalLink size={20} className="mr-2"/>View profile</Button>
          </Link>
        </div>
        <p>
            Thank you for your interest in joining our network of healthcare providers! Fill-up the form below to complete your profile.
        </p>
      </div>
      <div className="space-y-10">
        <Suspend>
          <HPPhoto profile={mappedProfile} type={type} hpId={hpId}/>
        </Suspend>
        <Suspend>
          <HPProfileForm profile={mappedProfile}/>
        </Suspend>
        <Suspend>
          <HPProfessionalInfo professionalDetails={professionalDetails}/>
        </Suspend>
      </div>
    </div>
  );
}


export default withPageAuthRequired(EditorPage, {
  returnTo({params, searchParams}) {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/hp/profile/${params?.practitioner}?${searchStr}`;
  },
});