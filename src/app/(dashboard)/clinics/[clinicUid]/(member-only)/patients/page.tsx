import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import { isHP } from "@lib/org-utils";
import { isClinicOwner } from "@lib/clinic-utils";
import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";
import SearchBar from "@components/dashboard/SearchBar";
import PageLoading from "@components/PageLoading";
import { redirect } from "next/navigation";
import { PatientList } from "@components/patient/PatientList";
import AddPatientModal from "@components/patient/modal/AddPatientModal";
import { AppRouterPageRouteOpts } from "@/types";
import { getCachedSession } from "@actions/session.action";

export const maxDuration = 30; // page timeout in seconds
export const revalidate = 60; // revalidation interval in seconds
export const metadata: Metadata = {
  title: "Patients List",
  description: "View and manage patient EMR",
};

export default async function PatientsPage(props: AppRouterPageRouteOpts) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const clinicUid = String(params?.clinicUid);
  const search = searchParams?.search as string;
  const page = parseInt(searchParams?.page as string) || 1;

  const session = await getCachedSession();

  if (!session?.user?.sub) {
    redirect("/unauthorized");
  }

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
    <div className="space-y-6">
      <div className=" flex justify-between items-center">
        <div className="">
          <h3 className="text-xl font-bold">Patient List</h3>
          <p className="text-sm text-muted-foreground">
            View and manage patients.
          </p>
        </div>
        <AddPatientModal
          clinicUid={clinicUid}
          roleName="patient"
        />
      </div>
      <Separator />
      <div className="flex-1 rounded-[0.5rem] border bg-background shadow">
        <div className="px-5 pt-5 flex justify-end">
          <SearchBar placeholder="Search for patient name of email" />
        </div>
        <Suspend loadingFallback={<PageLoading label="Loading Records ..." />}>
          <PatientList clinicUid={clinicUid} search={search} page={page} />
        </Suspend>
      </div>
    </div>
  );
}

