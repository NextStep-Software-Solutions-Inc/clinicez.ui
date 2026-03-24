import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCachedSession } from "@/actions/session.action";
import { getHPsAction } from "@/actions/hp.actions";
import { Button } from "@/components/ui/button";
import V2HPApplyForm from "./_components/V2HPApplyForm";
import { Stethoscope, CheckCircle, UserCircle, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Apply as Healthcare Provider | ClinicEZ",
  description: "Register as a healthcare provider on the ClinicEZ platform.",
};

const STEPS = [
  {
    icon: <Stethoscope size={24} />,
    title: "Select HP Type",
    description: "Choose your healthcare provider specialty.",
  },
  {
    icon: <UserCircle size={24} />,
    title: "Build Your Profile",
    description: "Fill in your professional information, qualifications, and experience.",
  },
  {
    icon: <ShieldCheck size={24} />,
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

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Healthcare Provider Application</h1>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          {status === "PENDING_PROFILE" && (
            <>
              <div className="flex items-center gap-3 text-amber-700">
                <UserCircle size={24} />
                <h2 className="text-xl font-semibold">Complete Your Profile</h2>
              </div>
              <p className="text-muted-foreground">
                You have already started your application as a{" "}
                <strong>{hp.HPType.name.replaceAll("_", " ")}</strong>. Please complete your profile
                and then submit for admin approval.
              </p>
              <Link href={`/v2/hp/${hp.id}/edit`}>
                <Button className="w-full">
                  Go to Profile Editor
                </Button>
              </Link>
            </>
          )}

          {status === "PENDING_APPROVAL" && (
            <>
              <div className="flex items-center gap-3 text-blue-700">
                <ShieldCheck size={24} />
                <h2 className="text-xl font-semibold">Application Under Review</h2>
              </div>
              <p className="text-muted-foreground">
                Your application as a <strong>{hp.HPType.name.replaceAll("_", " ")}</strong> is
                currently being reviewed by a ClinicEZ system admin. You will be notified once a
                decision has been made.
              </p>
              <Link href={`/v2/hp/${hp.id}/edit`}>
                <Button variant="outline" className="w-full">
                  View / Edit My Profile
                </Button>
              </Link>
            </>
          )}

          {status === "APPROVED" && (
            <>
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle size={24} />
                <h2 className="text-xl font-semibold">Application Approved!</h2>
              </div>
              <p className="text-muted-foreground">
                Congratulations! Your application as a{" "}
                <strong>{hp.HPType.name.replaceAll("_", " ")}</strong> has been approved.
              </p>
              <Link href={`/v2/hp/${hp.id}/edit`}>
                <Button className="w-full">
                  Manage My HP Profile
                </Button>
              </Link>
            </>
          )}

          {status === "REJECTED" && (
            <>
              <div className="flex items-center gap-3 text-red-700">
                <ShieldCheck size={24} />
                <h2 className="text-xl font-semibold">Application Not Approved</h2>
              </div>
              <p className="text-muted-foreground">
                Unfortunately, your application as a{" "}
                <strong>{hp.HPType.name.replaceAll("_", " ")}</strong> was not approved. Please
                update your profile and resubmit, or contact our support team for assistance.
              </p>
              <Link href={`/v2/hp/${hp.id}/edit`}>
                <Button className="w-full">
                  Update Profile &amp; Resubmit
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Apply as a Healthcare Provider</h1>
        <p className="text-muted-foreground">
          Join the ClinicEZ network of trusted healthcare professionals. Your application will be
          reviewed and approved by a ClinicEZ system admin.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold text-lg">How It Works</h2>
        <ol className="space-y-4">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Application form */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold text-lg">Step 1: Select Your Provider Type</h2>
        <V2HPApplyForm />
      </div>
    </div>
  );
}
