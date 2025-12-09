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
import Each from "./utils/Each";
import dayjs from "dayjs";
import { Badge } from "./ui/badge";
import { cn } from "@lib/utils";
import { User, Pill, FileText, Camera, Stethoscope } from "lucide-react";
import { GetConsultationTickets } from "@actions/consultation/consultation-ticket.action";

interface MedicalHistoryProps {
  patientId: string
  clinicUid: string
}

export default function MedicalHistory({ clinicUid, patientId }: MedicalHistoryProps) {
  const { user: authUser } = useUser()
  const isPatientView = authUser?.id === patientId

  const { data: consultationTickets } = useConsultations({
    clinicUid,
    userId: patientId,
  })

  return (
    <Accordion type="multiple" className="w-full">
      <Each
        of={consultationTickets?.data || []}
        fallback={<p className="text-muted-foreground">No consultation records.</p>}
        render={(ticket) => {
          return (
            <AccordionItem key={ticket.id} value={ticket.id.toString()}>
              <AccordionTrigger>
                <div>
                  {ticket.subject || `Consultation Ticket #${ticket.id}`} ({dayjs(ticket.createdAt).format("llll")}) <Badge variant="outline" className="text-primary">{ticket.System.name}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 space-y-4">
                  <CateredBySection ticket={ticket} />
                  <MedicalHistorySummary
                    consultationTicketId={ticket.id}
                    clinicUid={clinicUid}
                    isPatientView={isPatientView}
                  />
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
    <div className="space-y-2">
      <p className="text-lg font-bold flex items-center gap-2">
        <Stethoscope className="h-5 w-5 text-primary" />
        Catered By
      </p>
      <div className="space-y-2">
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
              : `${user?.firstName || ''} ${user?.middleName || ''} ${user?.lastName || ''} ${user?.suffix || ''}`.trim();

            return (
              <div key={provider?.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{displayName || 'Unknown Provider'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {hpProfile?.fields && <Badge variant="secondary" className="text-xs">{hpProfile.fields}</Badge>}
                    {roleName && <span>{roleName}</span>}
                  </div>
                </div>
                <Badge variant="outline" className="text-blue-600">Healthcare Provider</Badge>
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
              ? `${createdBy.firstName || ''} ${createdBy.middleName || ''} ${createdBy.lastName || ''} ${createdBy.suffix || ''}`.trim()
              : 'Unknown';
            const roleName = createdBy?.OrganizationMembers?.[0]?.OrganizationRole?.name;

            return (
              <div key={note.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <User className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    Pre-assessment at {dayjs(note.createdAt).format("MMM D, YYYY h:mm A")}
                    {roleName && ` • ${roleName}`}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600">Pre-Assessment</Badge>
              </div>
            );
          }}
        />

        {/* Received By */}
        {receivedBy && (
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
            <User className="h-4 w-4 text-purple-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {`${receivedBy.firstName || ''} ${receivedBy.middleName || ''} ${receivedBy.lastName || ''} ${receivedBy.suffix || ''}`.trim()}
              </p>
              <p className="text-xs text-muted-foreground">
                {receivedAt && `Received at ${dayjs(receivedAt).format("MMM D, YYYY h:mm A")}`}
                {receivedBy.OrganizationMembers?.[0]?.OrganizationRole?.name && ` • ${receivedBy.OrganizationMembers[0].OrganizationRole.name}`}
              </p>
            </div>
            <Badge variant="outline" className="text-purple-600">Received By</Badge>
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

  const hasPrescriptions = (prescriptions?.length ?? 0) > 0;
  const hasLabRequests = (laboratoryRequests?.data?.length ?? 0) > 0;
  const hasImagingStudies = (imagingStudies?.data?.length ?? 0) > 0;

  const hasAnyFiles = hasPrescriptions || hasLabRequests || hasImagingStudies;
  const isLoading = prescriptionsLoading || labLoading || imagingLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Clinical Files
        </p>
        <p className="text-sm text-muted-foreground">Loading clinical files...</p>
      </div>
    );
  }

  if (!hasAnyFiles) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-lg font-bold flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Clinical Files
      </p>
      <div className="space-y-3">
        {/* Prescriptions */}
        {hasPrescriptions && (
          <div className="space-y-1">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Pill className="h-4 w-4 text-orange-500" />
              Prescriptions ({prescriptions?.length || 0})
            </p>
            <div className="ml-6 space-y-1">
              <Each
                of={prescriptions || []}
                render={(prescription) => (
                  <div key={prescription.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{prescription.name || `Prescription #${prescription.serialNumber || prescription.id}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {prescription.Medicines?.length || 0} medicine(s) • {dayjs(prescription.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-orange-600">{prescription.serialNumber || `#${prescription.id}`}</Badge>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Laboratory Requests */}
        {hasLabRequests && (
          <div className="space-y-1">
            <p className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Laboratory Requests ({laboratoryRequests?.data?.length || 0})
            </p>
            <div className="ml-6 space-y-1">
              <Each
                of={laboratoryRequests?.data || []}
                render={(request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg text-sm">
                    <div className="flex-1">
                      <p className="font-medium">
                        {request._count?.LaboratoryRequestDiagnostics || 0} test(s) requested
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.impression && `${request.impression} • `}{dayjs(request.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-blue-600">{request.serialNumber || `#${request.id}`}</Badge>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Imaging Studies */}
        {hasImagingStudies && (
          <div className="space-y-1">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-green-500" />
              Imaging Studies ({imagingStudies?.data?.length || 0})
            </p>
            <div className="ml-6 space-y-1">
              <Each
                of={imagingStudies?.data || []}
                render={(study) => (
                  <div key={study.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg text-sm">
                    <div className="flex-1">
                      <p className="font-medium">
                        {study.reason || `Imaging Study #${study.serialNumber || study.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {study.impression && `${study.impression} • `}{dayjs(study.createdAt).format("MMM D, YYYY")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600">{study.serialNumber || `#${study.id}`}</Badge>
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
    <div className="space-y-2">
      <p className="text-lg font-bold">Notes Summary</p>
      <Each
        of={consultationTicket?.data?.ConsultationNotes || []}
        fallback={<p className="text-muted-foreground">No notes</p>}
        render={(note) => {
          const shouldBlur = isPatientView && !note.showOnPatient
          const displayContent = shouldBlur
            ? "This information is only visible to healthcare providers."
            : (note.content ?? "")
          return (
            <div key={note.section} className="p-2 bg-gray-100 rounded-lg">
              <p className="capitalize font-semibold ">{note.section}</p>
              <p className={cn("text-sm text-gray-500", shouldBlur && "blur-sm")}>{displayContent}</p>
            </div>
          )
        }}
      />
    </div>
  )
}