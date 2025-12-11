"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion"
import { useUser } from "@clerk/nextjs"
import { useConsultation, useConsultations } from "@hooks/useConsultation";
import { usePrescriptions } from "@hooks/usePrescriptions";
import { useLaboratoryRequests } from "@hooks/useLaboratoryRequests";
import { useImagingStudies } from "@hooks/useImagingStudies";
import { useMedicalCertificates } from "@hooks/useMedicalCertificate";
import { useReferralSlips } from "@hooks/useReferralSlips";
import Each from "./utils/Each";
import dayjs from "dayjs";
import { Badge } from "./ui/badge";
import { cn } from "@lib/utils";
import { User, Pill, FileText, Camera, Stethoscope, Calendar, FileCheck, FileSignature } from "lucide-react";
import { GetConsultationTickets } from "@actions/consultation/consultation-ticket.action";

interface MedicalHistoryProps {
  patientId: string
  clinicUid: string
}

/**
 * Formats a person's full name from individual name parts
 */
const formatFullName = (
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null,
  suffix?: string | null
): string => {
  return `${firstName || ''} ${middleName || ''} ${lastName || ''} ${suffix || ''}`.trim();
};

/**
 * Pluralizes a word based on count
 */
const pluralize = (count: number, singular: string, plural: string): string => {
  return `${count} ${count === 1 ? singular : plural}`;
};

export default function MedicalHistory({ clinicUid, patientId }: MedicalHistoryProps) {
  const { user: authUser } = useUser()
  const isPatientView = authUser?.id === patientId

  const { data: consultationTickets } = useConsultations({
    clinicUid,
    userId: patientId,
  })

  return (
    <Accordion type="multiple" className="w-full space-y-3">
      <Each
        of={consultationTickets?.data || []}
        fallback={<p className="text-muted-foreground">No consultation records.</p>}
        render={(ticket) => {
          return (
            <AccordionItem 
              key={ticket.id} 
              value={ticket.id.toString()}
              className="border rounded-lg shadow-sm bg-white overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline">
                <div className="flex flex-col items-start gap-1 text-left w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base">
                      {ticket.subject || `Consultation #${ticket.id}`}
                    </span>
                    <Badge variant="outline" className="text-primary border-primary">
                      {ticket.System.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {dayjs(ticket.createdAt).format("dddd, MMMM D, YYYY [at] h:mm A")}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="border-t bg-gray-50/50">
                  {/* Catered By Section */}
                  <CateredBySection ticket={ticket} />
                  
                  {/* Notes Summary Section */}
                  <MedicalHistorySummary
                    consultationTicketId={ticket.id}
                    clinicUid={clinicUid}
                    isPatientView={isPatientView}
                  />
                  
                  {/* Clinical Files Section */}
                  <ClinicalFilesSection
                    consultationTicketId={ticket.id}
                    clinicUid={clinicUid}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        }}
      />
    </Accordion>
  )
}

type ConsultationTicket = NonNullable<GetConsultationTickets["data"]>[number];

interface CateredBySectionProps {
  ticket: ConsultationTicket
}

const CateredBySection = ({ ticket }: CateredBySectionProps) => {
  const healthcareProviders = ticket.ConsultationTicketHPs || [];
  const preAssessmentNotes = ticket.Appointment?.PreAssessmentNotes || [];
  const receivedBy = ticket.Appointment?.AppointmentAttribute?.ReceivedBy;
  const receivedAt = ticket.Appointment?.AppointmentAttribute?.receivedAt;

  const hasProviders = healthcareProviders.length > 0 || preAssessmentNotes.length > 0 || receivedBy;

  if (!hasProviders) {
    return null;
  }

  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-primary/10 rounded-md">
          <Stethoscope className="h-4 w-4 text-primary" />
        </div>
        <h4 className="font-semibold text-sm text-gray-700">Catered By</h4>
      </div>
      <div className="space-y-2 pl-2">
        {/* Healthcare Providers (Doctors) */}
        <Each
          of={healthcareProviders}
          render={(hp) => {
            const provider = hp.HealthCareProvider;
            const user = provider?.User;
            const hpProfile = provider?.HPProfile;
            const roleName = user?.OrganizationMembers?.[0]?.OrganizationRole?.name;
            
            const displayName = hpProfile?.name 
              ? `${hpProfile.title || ''} ${hpProfile.name} ${hpProfile.suffix || ''}`.trim()
              : formatFullName(user?.firstName, user?.middleName, user?.lastName, user?.suffix);

            return (
              <div key={provider?.id} className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                <div className="p-1 bg-blue-100 rounded-full">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName || 'Unknown Provider'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {hpProfile?.specialties && hpProfile.specialties.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {hpProfile.specialties.join(", ")}
                      </Badge>
                    )}
                    {roleName && <span>{roleName}</span>}
                  </div>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 shrink-0">Healthcare Provider</Badge>
              </div>
            );
          }}
        />

        {/* Pre-Assessment Notes (Nurse) */}
        <Each
          of={preAssessmentNotes}
          render={(note) => {
            const createdBy = note.CreatedBy;
            const displayName = createdBy 
              ? formatFullName(createdBy.firstName, createdBy.middleName, createdBy.lastName, createdBy.suffix)
              : 'Unknown';
            const roleName = createdBy?.OrganizationMembers?.[0]?.OrganizationRole?.name;

            return (
              <div key={note.id} className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg border border-green-100">
                <div className="p-1 bg-green-100 rounded-full">
                  <User className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    Pre-assessment at {dayjs(note.createdAt).format("MMM D, YYYY h:mm A")}
                    {roleName && ` • ${roleName}`}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 shrink-0">Pre-Assessment</Badge>
              </div>
            );
          }}
        />

        {/* Received By */}
        {receivedBy && (
          <div className="flex items-center gap-2 p-2.5 bg-purple-50 rounded-lg border border-purple-100">
            <div className="p-1 bg-purple-100 rounded-full">
              <User className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {formatFullName(receivedBy.firstName, receivedBy.middleName, receivedBy.lastName, receivedBy.suffix)}
              </p>
              <p className="text-xs text-muted-foreground">
                {receivedAt && `Received at ${dayjs(receivedAt).format("MMM D, YYYY h:mm A")}`}
                {receivedBy.OrganizationMembers?.[0]?.OrganizationRole?.name && ` • ${receivedBy.OrganizationMembers[0].OrganizationRole.name}`}
              </p>
            </div>
            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 shrink-0">Received By</Badge>
          </div>
        )}
      </div>
    </div>
  );
};

interface ClinicalFilesSectionProps {
  consultationTicketId: number
  clinicUid: string
}

const ClinicalFilesSection = ({ consultationTicketId, clinicUid }: ClinicalFilesSectionProps) => {
  const { prescriptions, isLoading: prescriptionsLoading } = usePrescriptions({
    clinicUid,
    consultationTicketId,
  });

  const { data: laboratoryRequests, isLoading: labLoading } = useLaboratoryRequests({
    clinicUid,
    consultationTicketId,
  });

  const { data: imagingStudies, isLoading: imagingLoading } = useImagingStudies({
    clinicUid,
    consultationTicketId,
  });

  const { data: medicalCertificates, isLoading: medCertLoading } = useMedicalCertificates({
    clinicUid,
    consultationTicketId,
  });

  const { data: referralSlips, isLoading: referralLoading } = useReferralSlips({
    clinicUid,
    consultationTicketId,
  });

  const hasPrescriptions = (prescriptions?.length ?? 0) > 0;
  const hasLabRequests = (laboratoryRequests?.data?.length ?? 0) > 0;
  const hasImagingStudies = (imagingStudies?.data?.length ?? 0) > 0;
  const hasMedicalCertificates = (medicalCertificates?.data?.length ?? 0) > 0;
  const hasReferralSlips = (referralSlips?.data?.length ?? 0) > 0;

  const hasAnyFiles = hasPrescriptions || hasLabRequests || hasImagingStudies || hasMedicalCertificates || hasReferralSlips;
  const isLoading = prescriptionsLoading || labLoading || imagingLoading || medCertLoading || referralLoading;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h4 className="font-semibold text-sm text-gray-700">Clinical Files</h4>
        </div>
        <p className="text-sm text-muted-foreground pl-2">Loading clinical files...</p>
      </div>
    );
  }

  if (!hasAnyFiles) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-primary/10 rounded-md">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <h4 className="font-semibold text-sm text-gray-700">Clinical Files</h4>
      </div>
      <div className="space-y-4 pl-2">
        {/* Prescriptions */}
        {hasPrescriptions && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-orange-100 rounded">
                <Pill className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Prescriptions ({prescriptions?.length || 0})</span>
            </div>
            <div className="ml-6 space-y-1.5">
              <Each
                of={prescriptions || []}
                render={(prescription) => {
                  const medicineCount = prescription.Medicines?.length || 0;
                  return (
                    <div key={prescription.id} className="flex items-center justify-between p-2.5 bg-orange-50 rounded-lg border border-orange-100 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{prescription.name || `Prescription #${prescription.serialNumber || prescription.id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {pluralize(medicineCount, 'medicine', 'medicines')} • {dayjs(prescription.createdAt).format("MMM D, YYYY")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 shrink-0">{prescription.serialNumber || `#${prescription.id}`}</Badge>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* Laboratory Requests */}
        {hasLabRequests && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Laboratory Requests ({laboratoryRequests?.data?.length || 0})</span>
            </div>
            <div className="ml-6 space-y-1.5">
              <Each
                of={laboratoryRequests?.data || []}
                render={(request) => {
                  const testCount = request._count?.LaboratoryRequestDiagnostics || 0;
                  return (
                    <div key={request.id} className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {pluralize(testCount, 'test', 'tests')} requested
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {request.impression && `${request.impression} • `}{dayjs(request.createdAt).format("MMM D, YYYY")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 shrink-0">{request.serialNumber || `#${request.id}`}</Badge>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* Imaging Studies */}
        {hasImagingStudies && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-green-100 rounded">
                <Camera className="h-3.5 w-3.5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Imaging Studies ({imagingStudies?.data?.length || 0})</span>
            </div>
            <div className="ml-6 space-y-1.5">
              <Each
                of={imagingStudies?.data || []}
                render={(study) => (
                  <div key={study.id} className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-100 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {study.reason || `Imaging Study #${study.serialNumber || study.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {study.impression && `${study.impression} • `}{dayjs(study.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 shrink-0">{study.serialNumber || `#${study.id}`}</Badge>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Medical Certificates */}
        {hasMedicalCertificates && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-purple-100 rounded">
                <FileCheck className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Medical Certificates ({medicalCertificates?.data?.length || 0})</span>
            </div>
            <div className="ml-6 space-y-1.5">
              <Each
                of={medicalCertificates?.data || []}
                render={(certificate) => (
                  <div key={certificate.id} className="flex items-center justify-between p-2.5 bg-purple-50 rounded-lg border border-purple-100 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        Medical Certificate #{certificate.serialNumber || certificate.id}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {certificate.impression && `${certificate.impression} • `}{dayjs(certificate.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 shrink-0">{certificate.serialNumber || `#${certificate.id}`}</Badge>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Referral Slips */}
        {hasReferralSlips && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-pink-100 rounded">
                <FileSignature className="h-3.5 w-3.5 text-pink-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Referral Slips ({referralSlips?.data?.length || 0})</span>
            </div>
            <div className="ml-6 space-y-1.5">
              <Each
                of={referralSlips?.data || []}
                render={(slip) => (
                  <div key={slip.id} className="flex items-center justify-between p-2.5 bg-pink-50 rounded-lg border border-pink-100 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        Referral Slip #{slip.serialNumber || slip.id}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {slip.referredTo && `Referred to: ${slip.referredTo} • `}{dayjs(slip.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-pink-600 border-pink-200 bg-pink-50 shrink-0">{slip.serialNumber || `#${slip.id}`}</Badge>
                  </div>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MedicalHistorySummaryProps {
  consultationTicketId: number
  clinicUid: string
  isPatientView?: boolean
}
export const MedicalHistorySummary = ({ consultationTicketId, clinicUid, isPatientView = false }: MedicalHistorySummaryProps) => {
  const { data: consultationTicket } = useConsultation({
    consultationId: consultationTicketId,
    clinicUid
  })
  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-gray-200 rounded-md">
          <FileText className="h-4 w-4 text-gray-600" />
        </div>
        <h4 className="font-semibold text-sm text-gray-700">Notes Summary</h4>
      </div>
      <div className="space-y-2 pl-2">
        <Each
          of={consultationTicket?.data?.ConsultationNotes || []}
          fallback={<p className="text-sm text-muted-foreground">No notes available</p>}
          render={(note) => {
            const shouldBlur = isPatientView && !note.showOnPatient
            const displayContent = shouldBlur
              ? "This information is only visible to healthcare providers."
              : (note.content ?? "")
            return (
              <div key={note.section} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="capitalize font-medium text-sm text-gray-800 mb-1">{note.section}</p>
                <p className={cn("text-sm text-gray-600", shouldBlur && "blur-sm")}>{displayContent}</p>
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}