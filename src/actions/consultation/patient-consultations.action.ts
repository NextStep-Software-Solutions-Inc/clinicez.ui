"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetPatientConsultations = Awaited<ReturnType<typeof getPatientConsultationsAction>>;
export const getPatientConsultationsAction = withErrorHandling(
  async ({ clinicUid, patientUserId }: { clinicUid: string; patientUserId: string }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const tickets = await prisma.consultationTicket.findMany({
      where: {
        isActive: true,
        Clinic: { clinicUid },
        OR: [
          {
            Appointment: {
              Requesters: {
                some: { User: { userId: patientUserId } },
              },
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        createdAt: true,
        updatedAt: true,
        isArchived: true,
        caseNumber: true,
        ConsultationTicketAttribute: {
          select: { status: true },
        },
        ConsultationTicketHPs: {
          select: {
            HealthCareProvider: {
              select: {
                id: true,
                HPProfile: {
                  select: { title: true, name: true, suffix: true },
                },
                User: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                HPType: { select: { name: true } },
              },
            },
          },
        },
        ConsultationNotes: {
          select: { id: true, section: true },
        },
        Prescriptions: {
          where: { isActive: true },
          select: { id: true },
        },
        MedicalCertificates: {
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        },
        LaboratoryRequests: {
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        },
        ImagingRequests: {
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        },
        Appointment: {
          select: {
            id: true,
            subject: true,
            complaint: true,
            AppointmentAttribute: {
              select: {
                status: true,
                date: true,
                timeStart: true,
                timeEnd: true,
                AppointmentType: { select: { name: true } },
                AppointmentMode: { select: { name: true } },
                Service: { select: { name: true } },
              },
            },
            PreAssessmentNotes: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                assessment: true,
                remarks: true,
              },
            },
          },
        },
      },
    });

    return { message: "Patient consultations fetched", data: tickets };
  }
);

export type GetPatientConsultationDetail = Awaited<ReturnType<typeof getPatientConsultationDetailAction>>;
export const getPatientConsultationDetailAction = withErrorHandling(
  async ({ clinicUid, ticketId }: { clinicUid: string; ticketId: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const ticket = await prisma.consultationTicket.findUnique({
      where: { id: ticketId, Clinic: { clinicUid }, isActive: true },
      select: {
        id: true,
        subject: true,
        createdAt: true,
        updatedAt: true,
        isArchived: true,
        caseNumber: true,
        ConsultationTicketAttribute: {
          select: {
            status: true,
            NoteTemplate: {
              select: {
                name: true,
                NoteSections: {
                  where: { isActive: true },
                  orderBy: { id: "asc" },
                  select: { id: true, name: true, label: true, description: true },
                },
              },
            },
          },
        },
        ConsultationTicketHPs: {
          select: {
            HealthCareProvider: {
              select: {
                id: true,
                HPProfile: { select: { title: true, name: true, suffix: true } },
                User: { select: { firstName: true, lastName: true, userId: true } },
                HPType: { select: { name: true } },
              },
            },
          },
        },
        ConsultationNotes: {
          select: { id: true, section: true, content: true, hpId: true, showOnPatient: true },
        },
        Prescriptions: {
          where: { isActive: true, isArchived: false },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            serialNumber: true,
            name: true,
            remarks: true,
            createdAt: true,
            HealthcareProvider: {
              select: {
                HPProfile: { select: { title: true, name: true } },
                User: { select: { firstName: true, lastName: true } },
              },
            },
            Medicines: {
              where: { isActive: true },
              select: { id: true, name: true, brandName: true, genericName: true, dosage: true, frequency: true, unit: true, duration: true, qty: true, notes: true },
            },
          },
        },
        MedicalCertificates: {
          where: { isActive: true, deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            serialNumber: true,
            remarks: true,
            impression: true,
            createdAt: true,
            Reason: { select: { name: true } },
            Finding: { select: { name: true } },
            Classification: { select: { name: true } },
            HealthCareProvider: {
              select: {
                HPProfile: { select: { title: true, name: true } },
                User: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        LaboratoryRequests: {
          where: { isActive: true, deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            serialNumber: true,
            impression: true,
            createdAt: true,
            LaboratoryRequestProcedures: {
              select: { LaboratoryProcedure: { select: { name: true } } },
            },
          },
        },
        ImagingRequests: {
          where: { isActive: true, deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            serialNumber: true,
            impression: true,
            history: true,
            reason: true,
            createdAt: true,
            ImagingRequestProcedures: {
              select: { ImagingProcedure: { select: { name: true } } },
            },
          },
        },
        Appointment: {
          select: {
            id: true,
            subject: true,
            complaint: true,
            AppointmentAttribute: {
              select: {
                status: true,
                date: true,
                timeStart: true,
                timeEnd: true,
                AppointmentType: { select: { name: true } },
                AppointmentMode: { select: { name: true } },
                Service: { select: { name: true } },
                ReceivedBy: { select: { firstName: true, lastName: true } },
              },
            },
            PreAssessmentNotes: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { assessment: true, remarks: true, homeInstructions: true },
            },
          },
        },
      },
    });

    if (!ticket) throw new Error("Consultation ticket not found");
    return { message: "Consultation detail fetched", data: ticket };
  }
);

export type GetClinicSystemsForPatient = Awaited<ReturnType<typeof getClinicSystemsAction>>;
export const getClinicSystemsAction = withErrorHandling(async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const systems = await prisma.system.findMany({
    where: { isActive: true, Clinic: { clinicUid } },
    select: { id: true, name: true },
  });
  return { message: "Systems fetched", data: systems };
});

export type GetMedCertTemplateOptions = Awaited<ReturnType<typeof getMedCertTemplateOptionsAction>>;
export const getMedCertTemplateOptionsAction = withErrorHandling(async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const templates = await prisma.documentTemplate.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      Clinic: { clinicUid },
      DocumentTemplateType: { name: "medical_certificate" },
    },
    select: {
      id: true,
      name: true,
      MedicalCertificateReasons: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
      MedicalCertificateFindings: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
      MedicalCertificateClassifications: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
    },
  });
  return { message: "Med cert templates fetched", data: templates };
});

export type GetClinicLabProcedures = Awaited<ReturnType<typeof getClinicLabProceduresAction>>;
export const getClinicLabProceduresAction = withErrorHandling(
  async ({ clinicUid, search }: { clinicUid: string; search?: string }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const sanitizedSearch = search?.trim().slice(0, 100);
    const clinic = await prisma.clinic.findUnique({ where: { clinicUid }, select: { id: true } });
    if (!clinic) throw new Error("Clinic not found");

    const procedures = await prisma.clinicLaboratoryProcedure.findMany({
      where: {
        clinicId: clinic.id,
        isActive: true,
        ...(sanitizedSearch ? { name: { contains: sanitizedSearch, mode: "insensitive" } } : {}),
      },
      take: 50,
      select: {
        id: true,
        name: true,
        description: true,
        MasterProcedure: { select: { category: true } },
      },
    });
    return { message: "Lab procedures fetched", data: procedures };
  }
);

export type GetClinicImagingProcedures = Awaited<ReturnType<typeof getClinicImagingProceduresAction>>;
export const getClinicImagingProceduresAction = withErrorHandling(
  async ({ clinicUid, search }: { clinicUid: string; search?: string }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const sanitizedSearch = search?.trim().slice(0, 100);
    const clinic = await prisma.clinic.findUnique({ where: { clinicUid }, select: { id: true } });
    if (!clinic) throw new Error("Clinic not found");

    const procedures = await prisma.clinicImagingProcedure.findMany({
      where: {
        clinicId: clinic.id,
        isActive: true,
        ...(sanitizedSearch ? { name: { contains: sanitizedSearch, mode: "insensitive" } } : {}),
      },
      take: 50,
      select: {
        id: true,
        name: true,
        description: true,
        MasterProcedure: { select: { category: true } },
      },
    });
    return { message: "Imaging procedures fetched", data: procedures };
  }
);
