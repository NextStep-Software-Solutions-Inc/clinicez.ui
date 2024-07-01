import { AppRouterPageRouteOpts, getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { getDoctorAction } from "@actions/doctor.action";
import { getNurseAction } from "@actions/nurse.action";
import HPProfile from "./components/HPProfile";
import HPProfessionalInfo from "./components/HPProfessionalInfo";
import { HPProfileType } from "./hp-form.schema";
import Suspend from "@components/Suspend";
import { getHPsActions, getProfessionalDetailsAction, setIsPublishAction } from "@actions/hp.actions";
import HPPhoto from "./components/HPPhoto";
import { Button } from "@components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import ActionButton from "@components/ActionButton";
import { notFound, redirect } from "next/navigation";
import { HealthcareProviderType } from "@prisma/client";

async function EditorPage({params, searchParams}: AppRouterPageRouteOpts) {
  const hpId = parseInt(params?.practitioner as string);
  const type = searchParams?._type as HealthcareProviderType;

  const session = await getSession();
  if(!session) return redirect("/api/auth/login");
  
  const myHps = await getHPsActions({
    userId: session.user.sub,
  });
  const isMyHp = myHps.some((hp) => hp.id === hpId);
  if(!isMyHp) return notFound();

  const actions = {
    NURSE: getNurseAction,
    DOCTOR: getDoctorAction,
  }

  const action = actions[type as keyof typeof actions];
  const profile = await action(hpId);
  
  const mappedProfile: HPProfileType = {
    id: profile?.id ?? 0,
    title: profile?.title ?? "",
    name: profile?.name ?? "",
    suffix: profile?.suffix ?? "",
    workEmail: profile?.workEmail ?? "",
    workPhone: profile?.workPhone ?? "",
    philosophy: profile?.philosophy ?? "",
    areaOfInterest: profile?.areaOfInterest ?? "",
    experience: profile?.experience ?? "",
    languages: profile?.languages.map((lang) => ({name: lang})) ?? [],
    specialties: profile?.specialties.map((lang) => ({name: lang})) ?? [],
    education: profile?.education.map((lang) => ({name: lang})) ?? [],
    certifications: profile?.certifications.map((lang) => ({name: lang})) ?? [],
    fields: profile?.fields.map((lang) => ({name: lang})) ?? [],
    affiliations: profile?.affiliations.map((lang) => ({name: lang})) ?? [],
  }

  const professionalDetails = await getProfessionalDetailsAction(hpId);

  const isPublished = profile?.HealthcareProvider.isPublished;
  const handleTogglePublish = async () => {
    "use server"
    await setIsPublishAction(hpId, !isPublished);
    revalidatePath(`/hp/profile/${hpId}?_type=${type}`);
  }

  return (
    <div className="container mx-auto my-10 relative">
      <div className="prose max-w-full mb-5">
        <div className="flex">
          <h1 className="capitalize flex-1">{type.replaceAll("_", " ").toLowerCase()} Profile Editor</h1>
          <form action={handleTogglePublish}>
            <ActionButton variant={isPublished? "destructive": "default"}>{isPublished ? "Unpublish": "Publish"}</ActionButton>
          </form>
          <Link href={`/hp/profile/${hpId}?_type=${type}`}>
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
          <HPProfile profile={mappedProfile}/>
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