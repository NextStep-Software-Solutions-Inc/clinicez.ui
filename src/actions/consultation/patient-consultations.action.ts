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
          {
            ClinicPatient: {
              Patient: { userId: patientUserId },
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
        ConsultationDiagnoses: {
          orderBy: [{ type: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            icd10Code: true,
            description: true,
            type: true,
            hpId: true,
            createdAt: true,
            HealthCareProvider: {
              select: {
                HPProfile: { select: { title: true, name: true } },
                User: { select: { firstName: true, lastName: true } },
              },
            },
          },
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
        HeartStationRequests: {
          where: { isActive: true, deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            serialNumber: true,
            impression: true,
            history: true,
            reason: true,
            createdAt: true,
            HeartStationRequestProcedures: {
              select: { HeartStationProcedure: { select: { name: true } } },
            },
          },
        },
        ClinicReferralSlips: {
          where: { isActive: true, deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            serialNumber: true,
            referredTo: true,
            reason: true,
            history: true,
            impression: true,
            recommendation: true,
            createdAt: true,
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
            AppointmentRouting: {
              select: {
                status: true,
                RoutedTo: {
                  select: {
                    id: true,
                    HPProfile: {
                      select: { title: true, name: true, suffix: true },
                    },
                    HPType: { select: { name: true } },
                    User: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) throw new Error("Consultation ticket not found");
    return { message: "Consultation detail fetched", data: ticket };
  }
);

/** Fetch only the MedicalCertificates section for a ticket (same shape as detail). */
export const getConsultationCertsForTicketAction = withErrorHandling(
  async ({ ticketId }: { ticketId: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");
    const data = await prisma.clinicMedicalCertificate.findMany({
      where: { consultationTicketId: ticketId, isActive: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, serialNumber: true, remarks: true, impression: true, createdAt: true,
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
    });
    return { message: "Certificates fetched", data };
  }
);

/** Fetch only the Prescriptions section for a ticket (same shape as detail). */
export const getConsultationPrescriptionsForTicketAction = withErrorHandling(
  async ({ ticketId }: { ticketId: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");
    const data = await prisma.prescription.findMany({
      where: { consultationTicketId: ticketId, isActive: true, isArchived: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, serialNumber: true, name: true, remarks: true, createdAt: true,
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
    });
    return { message: "Prescriptions fetched", data };
  }
);

/** Fetch only LaboratoryRequests + ImagingRequests + HeartStationRequests for a ticket (same shapes as detail). */
export const getConsultationDiagnosticsForTicketAction = withErrorHandling(
  async ({ ticketId }: { ticketId: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");
    const [labs, imaging, heartStation] = await Promise.all([
      prisma.clinicLaboratoryRequest.findMany({
        where: { consultationTicketId: ticketId, isActive: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, serialNumber: true, impression: true, createdAt: true,
          LaboratoryRequestProcedures: {
            select: { LaboratoryProcedure: { select: { name: true } } },
          },
        },
      }),
      prisma.clinicImagingRequest.findMany({
        where: { consultationTicketId: ticketId, isActive: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, serialNumber: true, impression: true, history: true, reason: true, createdAt: true,
          ImagingRequestProcedures: {
            select: { ImagingProcedure: { select: { name: true } } },
          },
        },
      }),
      prisma.clinicHeartStationRequest.findMany({
        where: { consultationTicketId: ticketId, isActive: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, serialNumber: true, impression: true, history: true, reason: true, createdAt: true,
          HeartStationRequestProcedures: {
            select: { HeartStationProcedure: { select: { name: true } } },
          },
        },
      }),
    ]);
    return { message: "Diagnostics fetched", data: { labs, imaging, heartStation } };
  }
);

/**
 * Clinic-wide consultation queue — returns all consultation tickets the
 * current user is allowed to see, enriched with patient identity so the
 * split-panel workspace can be rendered without a separate patient lookup.
 *
 * Supports cursor-based pagination: pass `cursor` (last seen ticket id) to
 * get the next page. Always returns `total` (matching rows) and `nextCursor`
 * (null when no more pages).
 */
const PAGE_SIZE = 20;
export type GetClinicConsultationQueue = Awaited<ReturnType<typeof getClinicConsultationQueueAction>>;
export const getClinicConsultationQueueAction = withErrorHandling(
  async ({
    clinicUid,
    status,
    hpOnly,
    cursor,
  }: {
    clinicUid: string;
    /** Filter by ticket status (e.g. "PROCESSING" | "RESOLVED"). Omit for all. */
    status?: string;
    /** When true, only returns tickets where the current user is a consulting HP. */
    hpOnly?: boolean;
    /** Cursor for pagination — the `id` of the last item from the previous page. */
    cursor?: number;
  }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const where = {
      isActive: true,
      isArchived: false,
      Clinic: { clinicUid },
      ...(status ? { ConsultationTicketAttribute: { status } } : {}),
      ...(hpOnly
        ? {
            ConsultationTicketHPs: {
              some: {
                HealthCareProvider: {
                  User: { userId: session.user.sub },
                },
              },
            },
          }
        : {}),
    } as const;

    const [total, items] = await Promise.all([
      prisma.consultationTicket.count({ where }),
      prisma.consultationTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          subject: true,
          caseNumber: true,
          createdAt: true,
          updatedAt: true,
          isArchived: true,
          ConsultationTicketAttribute: {
            select: { status: true },
          },
          ConsultationTicketHPs: {
            select: {
              HealthCareProvider: {
                select: {
                  id: true,
                  HPProfile: { select: { title: true, name: true, suffix: true } },
                  User: { select: { firstName: true, lastName: true } },
                  HPType: { select: { name: true } },
                },
              },
            },
          },
          ConsultationNotes: { select: { id: true, section: true } },
          Prescriptions: { where: { isActive: true }, select: { id: true } },
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
                  AppointmentType: { select: { name: true } },
                  Service: { select: { name: true } },
                },
              },
              Requesters: {
                take: 1,
                select: {
                  User: {
                    select: {
                      id: true,
                      userId: true,
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      suffix: true,
                      dob: true,
                      gender: true,
                      ClinicPatients: {
                        where: { Clinic: { clinicUid }, isActive: true, deletedAt: null },
                        take: 1,
                        select: { id: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const hasMore = items.length > PAGE_SIZE;
    // Slice to the page boundary; cursor = id of the last returned item
    const page = hasMore ? items.slice(0, PAGE_SIZE) : items;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return {
      message: "Clinic consultation queue fetched",
      data: { items: page, total, nextCursor },
    };
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

export type GetClinicHeartStationProcedures = Awaited<ReturnType<typeof getClinicHeartStationProceduresAction>>;
export const getClinicHeartStationProceduresAction = withErrorHandling(
  async ({ clinicUid, search }: { clinicUid: string; search?: string }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const sanitizedSearch = search?.trim().slice(0, 100);
    const clinic = await prisma.clinic.findUnique({ where: { clinicUid }, select: { id: true } });
    if (!clinic) throw new Error("Clinic not found");

    const procedures = await prisma.clinicHeartStationProcedure.findMany({
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
      },
    });
    return { message: "Heart station procedures fetched", data: procedures };
  }
);

/** Fetch only ReferralSlips for a ticket. */
export const getConsultationReferralsForTicketAction = withErrorHandling(
  async ({ ticketId }: { ticketId: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");
    const data = await prisma.clinicReferralSlip.findMany({
      where: { consultationTicketId: ticketId, isActive: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        serialNumber: true,
        referredTo: true,
        reason: true,
        history: true,
        impression: true,
        recommendation: true,
        createdAt: true,
      },
    });
    return { message: "Referral slips fetched", data };
  }
);
