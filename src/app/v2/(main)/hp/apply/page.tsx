import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCachedSession } from "@/actions/session.action";
import { getHPsAction } from "@/actions/hp.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import V2HPApplyForm from "./_components/V2HPApplyForm";
import HeroBackground from "@/components/HeroBackground";
import HeaderTitle from "@/components/HeaderTitle";
import {
  Stethoscope,
  CheckCircle,
  UserCircle,
  ShieldCheck,
  ClipboardList,
  ArrowRight,
  Clock,
  XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apply as Healthcare Provider | ClinicEZ",
  description: "Register as a healthcare provider on the ClinicEZ platform.",
};

const STEPS = [
  {
    icon: Stethoscope,
    step: "01",
    title: "Select HP Type",
    description: "Choose the healthcare provider specialty that best describes your practice.",
  },
  {
    icon: UserCircle,
    step: "02",
    title: "Build Your Profile",
    description: "Fill in your professional information, qualifications, and experience.",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Admin Approval",
    description: "A ClinicEZ admin will review and approve your application.",
  },
];

export default async function V2HPApplyPage() {
  const session = await getCachedSession();
  if (!session) return redirect("/sign-in");

  const hps = await getHPsAction({ userId: session.user.sub });

  if (hps && hps.length > 0) {
    const hp = hps[0];
    const status = hp.applicationStatus;
    const typeName = hp.HPType.name.replaceAll("_", " ");

    return (
      <div className="container mx-auto px-8 py-8 space-y-8 max-w-4xl">
        <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
        <HeaderTitle
          header={[{ text: "Healthcare Provider Application", className: "text-primary-v2" }]}
          description="Manage your ClinicEZ healthcare provider application status."
          className="text-center"
        />

        {status === "PENDING_PROFILE" && (
          <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <UserCircle size={24} />
                </div>
                <div>
                  <CardTitle className="text-amber-800">Complete Your Profile</CardTitle>
                  <CardDescription className="text-amber-700">
                    Application as <strong>{typeName}</strong> — profile pending
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800">
                You have already started your application as a <strong>{typeName}</strong>. Please
                complete your profile and then submit for admin approval.
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/v2/hp/${hp.id}/edit`} className="w-full">
                <Button className="w-full">
                  Go to Profile Editor
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {status === "PENDING_APPROVAL" && (
          <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Clock size={24} />
                </div>
                <div>
                  <CardTitle className="text-blue-800">Application Under Review</CardTitle>
                  <CardDescription className="text-blue-700">
                    Application as <strong>{typeName}</strong> — awaiting admin decision
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800">
                Your application as a <strong>{typeName}</strong> is currently being reviewed by a
                ClinicEZ system admin. You will be notified once a decision has been made.
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/v2/hp/${hp.id}/edit`} className="w-full">
                <Button variant="outline" className="w-full border-blue-300 text-blue-800 hover:bg-blue-100">
                  View / Edit My Profile
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {status === "APPROVED" && (
          <Card className="border-green-200 bg-green-50/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <CardTitle className="text-green-800">Application Approved!</CardTitle>
                  <CardDescription className="text-green-700">
                    You are now an active <strong>{typeName}</strong> on ClinicEZ
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-800">
                Congratulations! Your application as a <strong>{typeName}</strong> has been
                approved. You are now part of the ClinicEZ healthcare network.
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/v2/hp/${hp.id}/edit`} className="w-full">
                <Button className="w-full">
                  Manage My HP Profile
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {status === "REJECTED" && (
          <Card className="border-red-200 bg-red-50/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
                  <XCircle size={24} />
                </div>
                <div>
                  <CardTitle className="text-red-800">Application Not Approved</CardTitle>
                  <CardDescription className="text-red-700">
                    Application as <strong>{typeName}</strong> — action required
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-800">
                Unfortunately, your application as a <strong>{typeName}</strong> was not approved.
                Please update your profile and resubmit, or contact our support team for assistance.
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/v2/hp/${hp.id}/edit`} className="w-full">
                <Button className="w-full">
                  Update Profile &amp; Resubmit
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-8 space-y-8 max-w-4xl">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
      <HeaderTitle
        header={[{ text: "Apply as a Healthcare Provider", className: "text-primary-v2" }]}
        description="Join the ClinicEZ network of trusted healthcare professionals. Your application will be reviewed and approved by a ClinicEZ system admin."
        className="text-center"
      />

      {/* How it works */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList size={20} />
            </div>
            <div>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Three simple steps to join our network</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center gap-3 p-4 rounded-xl bg-muted/40 border border-border/50"
                >
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon size={26} />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Application form */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Stethoscope size={20} />
            </div>
            <div>
              <CardTitle>Step 1: Select Your Provider Type</CardTitle>
              <CardDescription>
                Choose the specialty that best represents your practice to get started.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <V2HPApplyForm />
        </CardContent>
      </Card>
    </div>
  );
}
