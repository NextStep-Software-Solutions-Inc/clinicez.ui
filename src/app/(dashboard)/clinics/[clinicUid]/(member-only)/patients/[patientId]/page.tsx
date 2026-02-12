import { notFound } from "next/navigation";
import { sessionCheck } from "@/lib/auth";
import { getClinicAction } from "@/actions/clinics/clinic.action";
import { getPatientDetails, getAccessorPatientPermissions } from "@/actions/patients/patient-details.action";
import PatientDetailsLayout from "@/components/patient/details/PatientDetailsLayout";
import { getUserAction } from "@/actions/users/user.action";

interface PatientDetailsPageProps {
  params: Promise<{
    clinicUid: string;
    patientId: string;
  }>;
}

export default async function PatientDetailsPage({ params }: PatientDetailsPageProps) {
  // Check authentication
  const session = await sessionCheck();
  if (!session?.user?.sub) {
    return notFound();
  }

  const [{data}, paramsResolved] = await Promise.all([getUserAction(session.user.sub), params]); // Placeholder for any future parallel data fetching needs
  if (!data || !data.id) {
    return notFound();
  }

  // Parse patientId

  const patientId = parseInt(paramsResolved.patientId, 10);
  console.log(paramsResolved.patientId, patientId);
  if (isNaN(patientId)) {
    return notFound();
  }

  // Get clinic data
  const clinicResult = await getClinicAction(paramsResolved.clinicUid);
  if (!clinicResult.status || !clinicResult.data) {
    return notFound();
  }

  const clinic = clinicResult.data;

  // Get patient details
  const patientResult = await getPatientDetails({
    patientId,
    clinicId: clinic.id,
    userId: data.id,
  });

  if (!patientResult.success || !patientResult.data) {
    return notFound();
  }

  const patient = patientResult.data;

  // Get accessor permissions for this patient
  const permissionsResult = await getAccessorPatientPermissions({
    clinicId: clinic.id,
    userId: data.id,
  });

  const permissions = permissionsResult.success && permissionsResult.data?.patientPermissions
    ? permissionsResult.data.patientPermissions
    : {
        canViewProfile: false,
        canEditProfile: false,
        canViewHealthRecords: false,
        canEditHealthRecords: false,
        canAddHealthRecords: false,
        canViewConsultations: false,
        canViewAuditLog: false,
        canExportAuditLog: false,
        canGenerateReport: false,
      };

  return (
    <div className="container mx-auto py-6">
      <PatientDetailsLayout
        patientId={patientId}
        clinicId={clinic.id}
        clinicUid={paramsResolved.clinicUid}
        userId={data.id}
        patientData={patient}
        permissions={permissions}
      />
    </div>
  );
}
