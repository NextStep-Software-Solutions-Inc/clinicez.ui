import Suspend from "@components/Suspend";
import { Metadata } from "next";
import { isClinicOwner } from "@lib/clinic-utils";
import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import PageLoading from "@components/PageLoading";
import { getCachedSession } from "@actions/session.action";
import { PatientsContainer } from "@components/patient/PatientsContainer";
import PatientsHeader from "@components/patient/PatientsHeader";
import UnauthorizedWarning from "@/components/UnauthorizedWarning";
import { getClinicAction } from "@/actions/clinics/clinic.action";
import { useUser } from "@/hooks/useUser";
import { getUserAction } from "@/actions/users/user.action";

export const maxDuration = 30;
export const revalidate = 60;
export const metadata: Metadata = {
  title: "Patients List",
  description: "View and manage patient EMR",
};

interface PatientsPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function PatientsPage(props: PatientsPageProps) {
  
  const session = await getCachedSession();
  if (!session?.user?.sub) return <UnauthorizedWarning/>;

  const { clinicUid } = await props.params;
  
  const [isOwner, myClinicMembership, myOrganizationMembership, clinic, userId] = await Promise.all([
    isClinicOwner(clinicUid),
    getClinicMembersAction({ userId: session.user.sub, clinicUid, status: "ACTIVE" }),
    getOrgMembersAction({ clinicUid, userId: session.user.sub, status: ["ACTIVE"] }),
    getClinicAction(clinicUid),
    getUserAction(session.user.sub),
  ]);

  const hasAccess = isOwner || !!myClinicMembership.data?.length || !!myOrganizationMembership.data?.data?.length;
  if (!hasAccess) return <UnauthorizedWarning/>;


  // Fetch patient data on server
  const pageSize = 50;
  console.log({session});
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[0.5rem] border bg-background shadow">
        <PatientsContainer 
          clinicUid={clinicUid}
          clinicId={clinic.data?.id}
          currentUserId={userId.data?.id}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
