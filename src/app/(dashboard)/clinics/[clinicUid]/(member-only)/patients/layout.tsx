import { getCachedSession } from "@actions/session.action";
import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import { isClinicOwner } from "@lib/clinic-utils";
import { redirect } from "next/navigation";

interface PatientListLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    clinicUid: string;
  }>
}
export default async function PatientListLayout(props: PatientListLayoutProps) {
  const params = await props.params;

  const {
    clinicUid
  } = params;

  const {
    children
  } = props;

  const session = await getCachedSession();

  if (!session?.user?.sub) {
    redirect("/unauthorized");
  }

  // Check clinic membership - allow clinic owner, clinic members, or organization members
  // Patients are excluded since they are not clinic members or organization members
  const [isOwner, myClinicMembership, myOrganizationMembership] = await Promise.all([
    isClinicOwner(clinicUid),
    getClinicMembersAction({
      userId: session.user.sub,
      clinicUid,
      status: "ACTIVE"
    }),
    getOrgMembersAction({
      clinicUid,
      userId: session.user.sub,
      status: ["ACTIVE"]
    })
  ]);

  // User must be clinic owner, clinic member, or organization member to access patient list
  // This excludes patients who are only registered in ClinicPatient table
  const hasStaffAccess = isOwner || !!myClinicMembership.data?.length || !!myOrganizationMembership.data?.data?.length;

  if (!hasStaffAccess) {
    redirect("/unauthorized");
  }
  return (
    <>{children}</>
  );
}
