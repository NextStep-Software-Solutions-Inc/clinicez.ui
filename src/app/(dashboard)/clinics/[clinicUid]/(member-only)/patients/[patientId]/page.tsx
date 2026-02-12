import { notFound } from "next/navigation";
import { sessionCheck } from "@/lib/auth";
import { getClinicAction } from "@/actions/clinics/clinic.action";
import { getPatientDetails, getPatientPermissions } from "@/actions/patients/patient-details.action";
import PatientDetailsLayout from "@/components/patient/details/PatientDetailsLayout";

interface PatientDetailsPageProps {
  params: {
    clinicUid: string;
    patientId: string;
  };
}

export default async function PatientDetailsPage({ params }: PatientDetailsPageProps) {
  // Check authentication
  const session = await sessionCheck();
  if (!session?.user?.id) {
    return notFound();
  }

  const userId = session.user.id;

  // Parse patientId
  const patientId = parseInt(params.patientId, 10);
  if (isNaN(patientId)) {
    return notFound();
  }

  // Get clinic data
  const clinicResult = await getClinicAction(params.clinicUid);
  if (!clinicResult.status || !clinicResult.data) {
    return notFound();
  }

  const clinic = clinicResult.data;

  // Get patient details
  const patientResult = await getPatientDetails({
    patientId,
    clinicId: clinic.id,
    userId,
  });

  if (!patientResult.success || !patientResult.data) {
    return notFound();
  }

  const patient = patientResult.data;

  // Get user permissions for this patient
  const permissionsResult = await getPatientPermissions({
    clinicId: clinic.id,
    userId,
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
        clinicUid={params.clinicUid}
        userId={userId}
        patientData={patient}
        permissions={permissions}
      />
    </div>
  );
}
