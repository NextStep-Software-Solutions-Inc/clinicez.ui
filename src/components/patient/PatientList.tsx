import { getUsersAction } from "@actions/users/user.action";
import Each from "@components/utils/Each";
import dynamic from "next/dynamic";
import { PatientCard } from "./PatientCard";
import { useClinicPatients } from "@/hooks/useClinicPatient";
import { getClinicPatientsAction } from "@/actions/clinics/clinic-patient.action";
const Paginate = dynamic(() => import("@components/Paginate"), { ssr: false, loading: () => <div>Loading...</div>});


interface PatientListProps {
  clinicUid: string
  search?: string
  page?: number
}

export type PatientsType = Awaited<ReturnType<typeof getClinicPatientsAction>> 
export const PatientList = async ({clinicUid, search, page = 1}:PatientListProps) => {
  const pageSize = 100;
  const total = 20;
  const  clinicPatients = await getClinicPatientsAction();
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 p-5">
        <Each
          of={clinicPatients.data ?? []}
          render={(patient) => (
            <PatientCard 
              key={patient.id}
              patient={patient}
            />
          )}
        />
      </div>
    
      <div className="mb-5 mx-5 flex justify-end">
        <Paginate initialPage={1} totalPages={Math.ceil(total/pageSize)}/>
      </div>
    </>
  );
};
