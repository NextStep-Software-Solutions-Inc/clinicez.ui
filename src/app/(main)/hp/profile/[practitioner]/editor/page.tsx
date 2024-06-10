import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import { getDoctorAction } from "@actions/doctor.action";
import { getNurseAction } from "@actions/nurse.action";
import HPProfile from "./components/HPProfile";
import HPProfessionalInfo from "./components/HPProfessionalInfo";
import { HPProfileType } from "./hp-form.schema";
import Suspend from "@components/Suspend";
import { getProfessionalDetailsAction } from "@actions/hp.actions";

export default  async function EditorPage({params, searchParams}: AppRouterPageRouteOpts) {
  const hpId = parseInt(params?.practitioner as string);
  const type = searchParams?._type as string;

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

  return (
    <div className="container mx-auto my-10">
      <div className="prose max-w-full mb-5">
        <h1 className="capitalize">My {type.replaceAll("_", " ").toLowerCase()} Profile</h1>
        <p>
            Thank you for your interest in joining our network of healthcare providers! Fill-up the form below to complete your profile.
        </p>
      </div>
      <div className="space-y-10">
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
