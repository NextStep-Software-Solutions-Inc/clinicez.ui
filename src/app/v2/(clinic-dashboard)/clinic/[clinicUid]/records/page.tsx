import type { Metadata } from "next";
import { getCachedSession } from "@/actions/session.action";
import { getPrescriptionsAction } from "@/actions/clinics/clinical-record/prescription.action";
import { getLaboratoryRequestsAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { getImagingStudiesAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { getHeartStationRequestsAction } from "@/actions/clinics/clinical-record/heart-station.action";
import { getMedicalCertificatesAction } from "@/actions/clinics/clinical-record/medical-certificate.action";
import { getReferralSlipsAction } from "@/actions/clinics/clinical-record/referral-slip.action";
import { syncClinicRecordsTemplatesAction } from "@/actions/clinics/clinic-document-setting.action";
import { ClinicRecordsClient } from "@/components/v2/clinic/records/ClinicRecordsClient";

export const metadata: Metadata = {
  title: "Records",
  description: "Clinic-wide clinical records — prescriptions, lab requests, imaging, heart station, medical certificates, and referral slips",
};

export const dynamic = "force-dynamic";

interface ClinicRecordsPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicRecordsPage({ params }: ClinicRecordsPageProps) {
  const { clinicUid } = await params;

  const session = await getCachedSession();
  if (!session?.user?.sub) throw new Error("User not authenticated");

  // Synchronize existing records to clinic default templates if needed
  await syncClinicRecordsTemplatesAction(clinicUid);

  const [
    prescriptionsResult,
    labResult,
    imagingResult,
    heartResult,
    medCertsResult,
    referralResult,
  ] = await Promise.all([
    getPrescriptionsAction({ clinicUid }),
    getLaboratoryRequestsAction({ clinicUid }),
    getImagingStudiesAction({ clinicUid }),
    getHeartStationRequestsAction({ clinicUid }),
    getMedicalCertificatesAction({ clinicUid }),
    getReferralSlipsAction({ clinicUid }),
  ]);

  return (
    <ClinicRecordsClient
      clinicUid={clinicUid}
      initialData={{
        prescriptions: prescriptionsResult.data ?? [],
        labRequests: labResult.data ?? [],
        imagingStudies: imagingResult.data ?? [],
        heartStationRequests: heartResult.data ?? [],
        medicalCertificates: medCertsResult.data ?? [],
        referralSlips: referralResult.data ?? [],
      }}
    />
  );
}
