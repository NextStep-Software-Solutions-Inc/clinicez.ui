import { notFound, redirect } from "next/navigation";
import { getCachedSession } from "@/actions/session.action";
import { getHPAction, getHPsAction, getProfessionalDetailsAction } from "@/actions/hp.actions";
import Suspend from "@/components/Suspend";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import V2HPProfileForm from "./_components/V2HPProfileForm";
import V2HPPhoto from "./_components/V2HPPhoto";
import HPApplicationStatusBadge from "./_components/HPApplicationStatusBadge";
import { type V2HPProfileType } from "./hp-v2-form.schema";
import { type Metadata } from "next";

export const dynamic = "force-dynamic";

interface EditHPPageProps {
  params: Promise<{ hpId: string }>;
}

export const metadata: Metadata = {
  title: "Edit HP Profile | ClinicEZ",
  description: "Edit your Healthcare Provider profile",
};

export default async function EditHPPage({ params }: EditHPPageProps) {
  const { hpId: hpIdParam } = await params;
  const hpId = Number(hpIdParam);
  if (isNaN(hpId)) return notFound();

  const session = await getCachedSession();
  const userId = session?.user.sub;
  if (!userId) return redirect("/sign-in");

  const myHps = await getHPsAction({ userId });
  const isMyHp = myHps.some((hp) => hp.id === hpId);
  if (!isMyHp) return notFound();

  const hp = await getHPAction({ id: hpId });
  if (!hp) return notFound();

  const mappedProfile: V2HPProfileType = {
    id: hp.HPProfile?.id,
    title: hp.HPProfile?.title ?? "",
    name: hp.HPProfile?.name ?? "",
    suffix: hp.HPProfile?.suffix ?? "",
    workEmail: hp.HPProfile?.workEmail ?? "",
    workPhone: hp.HPProfile?.workPhone ?? "",
    philosophy: hp.HPProfile?.philosophy ?? "",
    areaOfInterest: hp.HPProfile?.areaOfInterest ?? "",
    hobbies: hp.HPProfile?.hobbies ?? "",
    experience: hp.HPProfile?.experience ?? "",
    picture: hp.HPProfile?.picture ?? "",
    cover: hp.HPProfile?.cover ?? "",
    eSignatureUrl: hp.HPProfile?.eSignatureUrl ?? "",
    languages: hp.HPProfile?.languages.map((lang) => ({ name: lang })) ?? [],
    specialties: hp.HPProfile?.specialties.map((s) => ({ name: s })) ?? [],
    educations: hp.HPProfile?.educations.map((e) => ({ name: e })) ?? [],
    certifications: hp.HPProfile?.certifications.map((c) => ({ name: c })) ?? [],
    fields: hp.HPProfile?.fields.map((f) => ({ name: f })) ?? [],
    affiliations: hp.HPProfile?.affiliations.map((a) => ({ name: a })) ?? [],
  };

  const applicationStatus = hp.applicationStatus ?? "PENDING_PROFILE";
  const hasProfile = !!hp.HPProfile?.name;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold capitalize">
            {hp.HPType.name.toLowerCase()} Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Keep your profile up to date so patients can find and learn about you.
          </p>
        </div>
        <Link href={`/hp/${hpId}`} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink size={16} className="mr-2" />
            View Public Profile
          </Button>
        </Link>
      </div>

      {/* Application Status */}
      <Suspend>
        <HPApplicationStatusBadge hpId={hpId} status={applicationStatus} hasProfile={hasProfile} />
      </Suspend>

      <Separator />

      {/* Photo Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Profile Photos</h2>
        <Suspend>
          <V2HPPhoto profile={mappedProfile} hpId={hpId} />
        </Suspend>
      </section>

      <Separator />

      {/* Profile Form */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Profile Information</h2>
        <Suspend>
          <V2HPProfileForm profile={mappedProfile} hpId={hpId} />
        </Suspend>
      </section>
    </div>
  );
}
