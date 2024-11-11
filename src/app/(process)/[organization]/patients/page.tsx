import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import { isHP } from "@lib/protect-org";
import SearchBar from "../../../../components/dashboard/SearchBar";
import PageLoading from "@components/PageLoading";
import { redirect } from "next/navigation";
import { PatientList } from "@components/patient/PatientList";
import AddPatientModal from "@components/patient/modal/AddPatientModal";

export const maxDuration = 30; // page timeout in seconds
export const revalidate  = 60; // revalidation interval in seconds
export const metadata: Metadata = {
  title: "Patients List",
  description: "View and manage patient EMR",
};

async function PatientsPage({params, searchParams}: AppRouterPageRouteOpts) {
  const orgId = params?.organization as string;
  const search = searchParams?.search as string;
  const page = parseInt(searchParams?.page as string) || 1;

  const [hp] = await Promise.all([isHP()])

  if(!hp) {
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
          orgUid={orgId}
        />
      </div>
      <Separator/>
      <div className="flex-1 rounded-[0.5rem] border bg-background shadow">
        <div className="px-5 pt-5 flex justify-end">
          <SearchBar placeholder="Search for patient name of email"/>
        </div>
        <Suspend loadingFallback={<PageLoading label="Loading Records ..."/>}>
          <PatientList orgId={orgId} search={search} page={page}/>
        </Suspend>
      </div>
    </div>
  );
}

export default withPageAuthRequired(PatientsPage);
