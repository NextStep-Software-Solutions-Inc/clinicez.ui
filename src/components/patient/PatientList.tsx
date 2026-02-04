import dynamic from "next/dynamic";
import { PatientListView } from "./PatientListView";
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
      <div className="pt-5">
        <PatientListView patients={clinicPatients.data ?? []} />
      </div>

      <div className="mb-5 mx-5 flex justify-end">
        <Paginate initialPage={page} totalPages={Math.ceil(total / pageSize)} />
      </div>
      <EMRPreviewSheetWrapper />
    </>
  );
};