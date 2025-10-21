import Each from "@components/utils/Each";
import dynamic from "next/dynamic";
import { PatientCard } from "./PatientCard";
import { getClinicPatientsAction } from "@/actions/clinics/clinic-patient.action";
import EMRPreviewSheetWrapper from "@components/EMRPreviewSheetWrapper";

const Paginate = dynamic(() => import("@components/Paginate"), { loading: () => <div>Loading...</div> });
interface PatientListProps {
  clinicUid: string
  search?: string
  page?: number
}

export const PatientList = async ({ clinicUid, search, page = 1 }: PatientListProps) => {
  const pageSize = 50;
  const total = 20;
  const clinicPatients = await getClinicPatientsAction({ clinicUid, search, pageNumber: page, pageSize });
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 p-5">
        <Each
          of={clinicPatients.data ?? []}
          fallback={<p className="text-muted-foreground text-center col-span-full">No patient record</p>}
          render={(patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
            />
          )}
        />
      </div>

      <div className="mb-5 mx-5 flex justify-end">
        <Paginate initialPage={page} totalPages={Math.ceil(total / pageSize)} />
      </div>
      <EMRPreviewSheetWrapper />
    </>
  );
};