import { getUsersAction } from "@actions/user.action";
import Each from "@components/utils/Each";
import dynamic from "next/dynamic";
import { PatientCard } from "./PatientCard";
const Paginate = dynamic(() => import("../../../../components/Paginate"), { ssr: false, loading: () => <div>Loading...</div>});


interface PatientListProps {
  orgId: string
  search?: string
  page?: number
}

export type PatientsType = Awaited<ReturnType<typeof getUsersAction>>[0] 
export const PatientList = async ({orgId, search, page = 1}:PatientListProps) => {
  const pageSize = 100;
  const [patients, total] = await getUsersAction({orgId, search, page, pageSize})
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 p-5">
        <Each
          of={patients}
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
