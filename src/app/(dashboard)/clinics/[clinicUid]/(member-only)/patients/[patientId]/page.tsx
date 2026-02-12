import { notFound } from "next/navigation";
import { sessionCheck } from "@/lib/auth";
import { getClinicAction } from "@/actions/clinics/clinics.action";
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
  if (!session?.user) {
    return notFound();
  }

  // Parse patientId
  const patientId = parseInt(params.patientId, 10);
  if (isNaN(patientId)) {
    return notFound();
  }

  // Get clinic data
  const clinicResult = await getClinicAction(params.clinicUid);
  if (!clinicResult.success || !clinicResult.data) {
    return notFound();
  }

  const clinic = clinicResult.data;

  // Get patient details
  const patientResult = await getPatientDetails({
    patientId,
    clinicId: clinic.id,
    userId: session.user.id,
  });

  if (!patientResult.success || !patientResult.data) {
    return notFound();
  }

  const patient = patientResult.data;

  // Get user permissions for this patient
  const permissionsResult = await getPatientPermissions({
    patientId,
    clinicId: clinic.id,
    userId: session.user.id,
  });

  const permissions = permissionsResult.success && permissionsResult.data
    ? permissionsResult.data
    : {
        canViewProfile: false,
        canEditProfile: false,
        canViewHealthRecords: false,
        canEditHealthRecords: false,
        canAddHealthRecords: false,
        canViewConsultations: false,
        canExportAuditLog: false,
        canGenerateReport: false,
      };

  return (
    <div className="container mx-auto py-6">
      <PatientDetailsLayout
        patient={patient}
        clinicId={clinic.id}
        currentUserId={session.user.id}
        permissions={permissions}
      />
    </div>
  );
}
