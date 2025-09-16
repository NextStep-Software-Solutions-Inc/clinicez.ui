import { getCachedSession } from "@actions/session.action";
import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import { isHP } from "@lib/org-utils";
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

  // Check both Healthcare Provider subscription AND clinic membership
  const [hp, isOwner, myClinicMembership, myOrganizationMembership] = await Promise.all([
    isHP(),
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

  const hasClinicAccess = isOwner || !!myClinicMembership.data?.length || !!myOrganizationMembership.data?.data?.length;

  if (!hp || !hasClinicAccess) {
    redirect("/unauthorized");
  }
  return (
    <>{children}</>
  );
}
