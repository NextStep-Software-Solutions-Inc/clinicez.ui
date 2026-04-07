import { notFound, redirect } from "next/navigation";
import { getCachedSession } from "@/actions/session.action";
import { getHPAction, getHPsAction } from "@/actions/hp.actions";
import Suspend from "@/components/Suspend";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Stethoscope, Camera } from "lucide-react";
import V2HPProfileForm from "./_components/V2HPProfileForm";
import V2HPPhoto from "./_components/V2HPPhoto";
import HPApplicationStatusBadge from "./_components/HPApplicationStatusBadge";
import { type V2HPProfileType } from "./hp-v2-form.schema";
import { type Metadata } from "next";
import HeroBackground from "@/components/HeroBackground";
import HeaderTitle from "@/components/HeaderTitle";

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
  const hpTypeName = hp.HPType.name.replaceAll("_", " ");

  return (
    <div className="container mx-auto px-8 py-8 space-y-8 max-w-4xl">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <HeaderTitle
            header={[
              { text: `${hpTypeName} `, className: "capitalize" },
              { text: "Profile Editor", className: "text-primary-v2" },
            ]}
            description="Keep your profile up to date so patients can find and learn about you."
          />
        </div>
        <Link href={`/hp/${hpId}`} target="_blank" className="shrink-0">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink size={15} />
            View Public Profile
          </Button>
        </Link>
      </div>

      {/* Application Status */}
      <Suspend>
        <HPApplicationStatusBadge hpId={hpId} status={applicationStatus} hasProfile={hasProfile} />
      </Suspend>

      {/* Photo Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Camera size={20} />
            </div>
            <div>
              <CardTitle>Profile Photos</CardTitle>
              <CardDescription>
                Upload a profile picture and cover photo for your public profile.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspend>
            <V2HPPhoto profile={mappedProfile} hpId={hpId} />
          </Suspend>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Stethoscope size={20} />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Fill in your professional details, qualifications, and background.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspend>
            <V2HPProfileForm profile={mappedProfile} hpId={hpId} />
          </Suspend>
        </CardContent>
      </Card>
    </div>
  );
}
