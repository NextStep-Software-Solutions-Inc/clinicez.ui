process.env.PHILHEALTH_KONSULTA_CERT_ID = "CERT-TEST-12345";
process.env.PHILHEALTH_KONSULTA_CIPHER_KEY = "CIPHERKEY12345678";

// Mock server-only
jest.mock("server-only", () => ({}));

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

// Mock session action
jest.mock("@/actions/session.action", () => ({
  getCachedSession: jest.fn(),
}));
jest.mock("@actions/session.action", () => ({
  getCachedSession: jest.fn(),
}));

// Mock konsulta-library-persistence
jest.mock("@/lib/konsulta-library-persistence", () => ({
  resolveMappedIcdCodesForConsultations: jest.fn().mockResolvedValue({ mappedDiagnoses: [], deficiencies: [] }),
  resolveMappedDiagnosticsForConsultations: jest.fn().mockResolvedValue({ mappedDiagnostics: [], deficiencies: [] }),
  resolveMappedManagementForConsultations: jest.fn().mockResolvedValue({ mappedManagements: [], deficiencies: [] }),
  resolveMappedMedicinesForConsultations: jest.fn(),
  resolveMappedMedicalHistoryForPatients: jest.fn().mockResolvedValue({ mappedMedicalHistory: [], deficiencies: [] }),
  resolveMappedImmunizationsForPatients: jest.fn().mockResolvedValue({ mappedImmunizations: [], deficiencies: [] }),
  resolveMappedPhysicalExamFindingsForConsultations: jest.fn().mockResolvedValue({ mappedFindings: [], deficiencies: [] }),
}));

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    $executeRaw: jest.fn().mockResolvedValue(1),
    konsultaBatch: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    konsultaEntry: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    clinicSetting: {
      findFirst: jest.fn(),
    },
    philHealthKonsultaEnlistment: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    consultationTicket: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock("@lib/prisma", () => ({
  __esModule: true,
  default: {
    $executeRaw: jest.fn().mockResolvedValue(1),
    konsultaBatch: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    konsultaEntry: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    clinicSetting: {
      findFirst: jest.fn(),
    },
    philHealthKonsultaEnlistment: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    consultationTicket: {
      findMany: jest.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { resolveMappedMedicinesForConsultations } from "@/lib/konsulta-library-persistence";
import { generateBatchXmlAction } from "./konsulta-report.action";

const mockPrisma = prisma as unknown as {
  $executeRaw: jest.Mock;
  konsultaBatch: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  konsultaEntry: {
    updateMany: jest.Mock;
    update: jest.Mock;
  };
  clinicSetting: {
    findFirst: jest.Mock;
  };
  philHealthKonsultaEnlistment: {
    findMany: jest.Mock;
  };
  user: {
    findMany: jest.Mock;
  };
  consultationTicket: {
    findMany: jest.Mock;
  };
};

const mockGetCachedSession = getCachedSession as unknown as jest.Mock;
const mockResolveMappedMedicines = resolveMappedMedicinesForConsultations as unknown as jest.Mock;

describe("konsulta-report.action: generateBatchXmlAction (PCB XML)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$executeRaw.mockResolvedValue(1);
    process.env = {
      ...originalEnv,
      PHILHEALTH_KONSULTA_CERT_ID: "CERT-TEST-12345",
      PHILHEALTH_KONSULTA_CIPHER_KEY: "CIPHERKEY12345678",
    };

    mockGetCachedSession.mockResolvedValue({
      user: {
        sub: "usr_admin_1",
        name: "DR. CLINIC DOCTOR",
        given_name: "CLINIC",
        family_name: "DOCTOR",
        email: "doctor@example.com",
      },
    });

    mockPrisma.clinicSetting.findFirst.mockResolvedValue({
      philhealthAccreditationNumber: "P10038831",
      philhealthYakapPmccNumber: "PMCC01",
      philhealthYakapUsername: "yakap_user",
      philhealthYakapPassword: "yakap_password",
      cipherKey: "CIPHERKEY12345678",
    });

    mockPrisma.philHealthKonsultaEnlistment.findMany.mockResolvedValue([
      {
        ClinicPatient: { patientId: 1001 },
        memberPin: "123456789012",
        memberFname: "JUAN",
        memberLname: "DELA CRUZ",
        memberMname: "SANTOS",
        memberExtname: "",
        memberDob: new Date("1990-01-01"),
      },
    ]);

    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 1001,
        dob: new Date("1990-01-01"),
        gender: "MALE",
        bloodType: "O_POSITIVE",
        PersonalHistory: null,
        ObGyneHistory: null,
        VitalSigns: [
          {
            bpSystolic: 120,
            bpDiastolic: 80,
            pulseRate: 72,
            respRate: 18,
            temp: 37.2,
            height: 170,
            weight: 70,
            bmi: 24.2,
            visualAcuityLeft: "20/20",
            visualAcuityRight: "20/20",
          },
        ],
        MedicalHistories: [],
        SurgicalHistories: [],
        FamilyMedicalHistories: [],
      },
    ]);

    mockPrisma.consultationTicket.findMany.mockResolvedValue([
      {
        id: 501,
        createdAt: new Date("2026-11-12T00:00:00Z"),
        subject: "Consultation 501",
        konsultaHciCaseNo: "TP1003883120261100001",
        konsultaHciTransNo: "SP1003883120261100001",
        konsultaAtc: "ATC001",
        konsultaIsWalkedIn: true,
        Appointment: null,
        ConsultationNotes: [],
        ConsultationDiagnoses: [{ icd10Code: "J00", type: "PRIMARY" }],
        Interventions: [],
        ClinicPatient: { patientId: 1001 },
        ConsultationTicketHPs: [
          {
            HealthCareProvider: {
              HPProfile: { title: "DR.", suffix: "MD" },
              User: { firstName: "ALICE", lastName: "SMITH" },
            },
          },
        ],
      },
    ]);

    mockPrisma.konsultaBatch.update.mockResolvedValue({ id: 1 });
    mockPrisma.konsultaEntry.updateMany.mockResolvedValue({ count: 1 });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const setupBatch = (medicines: Array<Record<string, unknown>>) => {
    mockPrisma.konsultaBatch.findUnique.mockResolvedValue({
      batchUid: "batch-uid-123",
      id: 1,
      clinicId: 10,
      period: "202611",
      reportTagging: "2",
      transmittalNo: "TP1003883120261100001",
      status: "DRAFT",
      xmlPayload: null,
      KonsultaEntries: [
        {
          id: 1,
          batchId: 1,
          patientUserId: 1001,
          philHealthPin: "123456789012",
          memberPin: "123456789012",
          memberType: "MM",
          hciCaseNo: "TP1003883120261100001",
          hciTransNo: "SP1003883120261100001",
          consultationIds: [501],
          status: "DRAFT",
          included: true,
          Patient: {
            id: 1001,
            userId: "usr_patient_1",
            firstName: "JUAN",
            lastName: "DELA CRUZ",
            middleName: "SANTOS",
            suffix: "",
            dob: new Date("1990-01-01"),
            gender: "MALE",
            mobile: "09171234567",
            email: "patient@example.com",
          },
        },
      ],
    });

    mockResolveMappedMedicines.mockResolvedValue({
      mappedMedicines: medicines.map((m, idx) => ({
        id: idx + 1,
        consultationId: (m.consultationId as number) ?? 501,
        sourceName: (m.name as string) ?? "Amoxicillin 500mg",
        mappedDrugCode: m.drugCode !== undefined ? (m.drugCode as string | null) : "DRUG-AMOX",
        mappedGenericCode: m.genericCode !== undefined ? (m.genericCode as string | null) : "GEN-AMOX",
        quantity: m.qty !== undefined ? (m.qty as number) : 20,
        dosage: (m.dosage as string) ?? "500mg",
        frequency: (m.frequency as string) ?? "TID",
        unit: "tab",
        notes: null,
      })),
      unmappedMedicines: [],
      deficiencies: [],
    });
  };

  // =========================================================================
  // TIER 1: Feature Coverage (Isolation / Happy-Path)
  // =========================================================================
  describe("Tier 1: Feature Coverage", () => {
    it("Feature #516: populates pPrescribingPhysician with doctor name in Konsulta report XML", async () => {
      setupBatch([
        {
          name: "Amoxicillin 500mg",
          drugCode: "DRUG-AMOX",
          genericCode: "GEN-AMOX",
          qty: 21,
          prescribingPhysician: "DR. ALICE SMITH",
        },
      ]);

      const res = await generateBatchXmlAction("batch-uid-123");
      expect(res.status).toBe(true);
      expect(res.data).not.toBeNull();
      expect(res.data?.xmlPayload).toBeDefined();

      const xml = (res.data?.xmlPayload || mockPrisma.konsultaBatch.update.mock.calls[0][0].data.xmlPayload) as string;
      expect(xml).toContain("<MEDICINE");
      expect(xml).toMatch(/pPrescribingPhysician="DR\.\s+ALICE\s+SMITH/i);
    });

    it("Feature #516: defaults pRoute to 'ORAL' when route is missing or empty in Konsulta report XML", async () => {
      setupBatch([
        {
          name: "Paracetamol 500mg",
          drugCode: "DRUG-PARA",
          genericCode: "GEN-PARA",
          qty: 10,
          route: "", // empty route
        },
      ]);

      const res = await generateBatchXmlAction("batch-uid-123");
      expect(res.status).toBe(true);
      expect(res.data).not.toBeNull();
      expect(res.data?.xmlPayload).toBeDefined();

      const xml = (res.data?.xmlPayload || mockPrisma.konsultaBatch.update.mock.calls[0][0].data.xmlPayload) as string;
      expect(xml).toContain('pRoute="ORAL"');
    });

    it("Feature #516: defaults unit price to '15.00' and calculates total price as quantity * unit price in Konsulta report XML", async () => {
      setupBatch([
        {
          name: "Amoxicillin 500mg",
          drugCode: "DRUG-AMOX",
          genericCode: "GEN-AMOX",
          qty: 10,
          actualUnitPrice: "", // empty
          totalAmtPrice: "", // empty
        },
      ]);

      const res = await generateBatchXmlAction("batch-uid-123");
      expect(res.status).toBe(true);
      expect(res.data).not.toBeNull();
      expect(res.data?.xmlPayload).toBeDefined();

      const xml = (res.data?.xmlPayload || mockPrisma.konsultaBatch.update.mock.calls[0][0].data.xmlPayload) as string;
      expect(xml).toContain('pActualUnitPrice="15.00"');
      expect(xml).toContain('pTotalAmtPrice="150.00"');
    });

    it("Feature #515: defaults unlisted medicine drug grouping to 'ANTIBIOTICS' and category to 'ANTI-INFECTIVES' in Konsulta report XML", async () => {
      setupBatch([
        {
          name: "Custom Unlisted Antibiotic 250mg",
          drugCode: null, // unlisted
          genericCode: null, // unlisted
          qty: 14,
          otherMedicine: "Custom Unlisted Antibiotic 250mg",
        },
      ]);

      const res = await generateBatchXmlAction("batch-uid-123");
      expect(res.status).toBe(true);
      expect(res.data).not.toBeNull();
      expect(res.data?.xmlPayload).toBeDefined();

      const xml = (res.data?.xmlPayload || mockPrisma.konsultaBatch.update.mock.calls[0][0].data.xmlPayload) as string;
      // Should clear 7 PNF library codes
      expect(xml).toContain('pDrugCode=""');
      expect(xml).toContain('pGenericCode=""');
      expect(xml).toContain('pSaltCode=""');
      expect(xml).toContain('pStrengthCode=""');
      expect(xml).toContain('pFormCode=""');
      expect(xml).toContain('pUnitCode=""');
      expect(xml).toContain('pPackageCode=""');
      // Should set otherMedicine, grouping, and category
      expect(xml).toContain('pOtherMedicine="Custom Unlisted Antibiotic 250mg"');
      expect(xml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
      expect(xml).toContain('pCategory="ANTI-INFECTIVES"');
    });
  });

  // =========================================================================
  // TIER 2: Boundary & Corner Cases
  // =========================================================================
  describe("Tier 2: Boundary & Corner Cases", () => {
    it("Boundary #516: defaults quantity to 1 and calculates totalAmtPrice as 15.00 when quantity is zero or missing", async () => {
      setupBatch([
        {
          name: "Paracetamol 500mg",
          drugCode: "DRUG-PARA",
          genericCode: "GEN-PARA",
          qty: 0,
        },
      ]);

      const res = await generateBatchXmlAction("batch-uid-123");
      expect(res.status).toBe(true);
      expect(res.data).not.toBeNull();
      expect(res.data?.xmlPayload).toBeDefined();

      const xml = (res.data?.xmlPayload || mockPrisma.konsultaBatch.update.mock.calls[0][0].data.xmlPayload) as string;
      expect(xml).toContain('pQuantity="1"');
      expect(xml).toContain('pActualUnitPrice="15.00"');
      expect(xml).toContain('pTotalAmtPrice="15.00"');
    });

    it("Boundary #516: falls back to session doctor when attending physician in consultation ticket is missing", async () => {
      mockPrisma.consultationTicket.findMany.mockResolvedValue([
        {
          id: 501,
          createdAt: new Date("2026-11-12T00:00:00Z"),
          subject: "Consultation 501",
          konsultaHciCaseNo: "TP1003883120261100001",
          konsultaHciTransNo: "SP1003883120261100001",
          konsultaAtc: "ATC001",
          konsultaIsWalkedIn: true,
          Appointment: null,
          ConsultationNotes: [],
          ConsultationDiagnoses: [{ icd10Code: "J00", type: "PRIMARY" }],
          Interventions: [],
          ClinicPatient: { patientId: 1001 },
          ConsultationTicketHPs: [],
        },
      ]);

      setupBatch([
        {
          name: "Amoxicillin 500mg",
          drugCode: "DRUG-AMOX",
          genericCode: "GEN-AMOX",
          qty: 10,
        },
      ]);

      const res = await generateBatchXmlAction("batch-uid-123");
      expect(res.status).toBe(true);
      expect(res.data).not.toBeNull();
      expect(res.data?.xmlPayload).toBeDefined();

      const xml = (res.data?.xmlPayload || mockPrisma.konsultaBatch.update.mock.calls[0][0].data.xmlPayload) as string;
      expect(xml).toMatch(/pPrescribingPhysician="DR\.\s+CLINIC\s+DOCTOR"/i);
    });
  });

  // =========================================================================
  // TIER 3: Cross-Feature Integration
  // =========================================================================
  describe("Tier 3: Cross-Feature Integration", () => {
    it("Cross-Feature: combines listed and unlisted medicines in Konsulta report XML", async () => {
      setupBatch([
        {
          name: "Amoxicillin 500mg",
          drugCode: "DRUG-AMOX",
          genericCode: "GEN-AMOX",
          qty: 21,
        },
        {
          name: "Herbal Capsule",
          drugCode: null,
          genericCode: null,
          qty: 10,
        },
      ]);

      const res = await generateBatchXmlAction("batch-uid-123");
      expect(res.status).toBe(true);
      expect(res.data).not.toBeNull();
      expect(res.data?.xmlPayload).toBeDefined();

      const xml = (res.data?.xmlPayload || mockPrisma.konsultaBatch.update.mock.calls[0][0].data.xmlPayload) as string;
      expect(xml).toContain('pDrugCode="DRUG-AMOX"');
      expect(xml).toContain('pOtherMedicine="Herbal Capsule"');
      expect(xml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
      expect(xml).toContain('pCategory="ANTI-INFECTIVES"');
      expect(xml).toContain('pRoute="ORAL"');
      expect(xml).toContain('pActualUnitPrice="15.00"');
    });
  });
});
