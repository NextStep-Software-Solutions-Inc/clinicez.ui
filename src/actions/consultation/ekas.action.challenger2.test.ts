/**
 * @jest-environment node
 */

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

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    consultationTicket: {
      findUnique: jest.fn(),
    },
    konsultaDiagnosticResult: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock("@lib/prisma", () => ({
  __esModule: true,
  default: {
    consultationTicket: {
      findUnique: jest.fn(),
    },
    konsultaDiagnosticResult: {
      findMany: jest.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { generateEkasPdfAction, generateEpressPdfAction } from "./ekas.action";
import { formatKonsultaHciNumber } from "@/lib/format-sequence";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

const mockPrisma = prisma as unknown as {
  consultationTicket: {
    findUnique: jest.Mock;
  };
  konsultaDiagnosticResult: {
    findMany: jest.Mock;
  };
};

const mockGetCachedSession = getCachedSession as unknown as jest.Mock;

describe("Challenger 2 Empirical Verification: Milestone 2 PDF & Sequence Compliance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCachedSession.mockResolvedValue({
      user: {
        sub: "usr_doc_challenger2",
        name: "DR. EMPIRICAL CHALLENGER 2",
        email: "challenger2@example.com",
      },
    });
    mockPrisma.konsultaDiagnosticResult.findMany.mockResolvedValue([]);
  });

  type MockTicketConfig = {
    createdAt?: Date | null;
    caseNumber?: string | null;
    konsultaHciCaseNo?: string | null;
    hciCaseNo?: string | null;
    soapTransNo?: string | null;
    konsultaHciTransNo?: string | null;
    profilingTransNo?: string | null;
    ekasTransactionNumber?: string | null;
    medicines?: Array<{
      name?: string | null;
      genericName?: string | null;
      dosage?: string | null;
      qty?: number | null;
      unit?: string | null;
      frequency?: string | null;
      duration?: string | null;
      drugCode?: string | null;
      genericCode?: string | null;
    }> | null;
    prescriptions?: Array<{ Medicines: Array<any> }> | null;
    physician?: {
      hasHp?: boolean;
      user?: { firstName?: string | null; lastName?: string | null } | null;
      hpProfile?: { title?: string | null; suffix?: string | null } | null;
      professionalDetails?: { licenseNumber?: string | null; ptrNumber?: string | null } | null;
    } | null;
  };

  const createTicket = (cfg: MockTicketConfig = {}) => {
    const createdAt = cfg.createdAt !== undefined ? cfg.createdAt : new Date("2026-06-01T12:00:00Z");

    let prescriptionsList: any[] = [];
    if (cfg.prescriptions !== undefined) {
      prescriptionsList = cfg.prescriptions || [];
    } else if (cfg.medicines !== undefined) {
      if (cfg.medicines === null) {
        prescriptionsList = [];
      } else {
        prescriptionsList = [
          {
            isActive: true,
            isArchived: false,
            Medicines: cfg.medicines.map((m) => ({
              name: m.name ?? "Test Med",
              genericName: m.genericName ?? "Test Generic",
              dosage: m.dosage ?? "500mg",
              qty: m.qty ?? 10,
              unit: m.unit ?? "tablets",
              frequency: m.frequency ?? "Once daily",
              duration: m.duration ?? "10 days",
              PhilHealthData: {
                drugCode: m.drugCode ?? "DRUG-001",
                genericCode: m.genericCode ?? "GEN-001",
              },
            })),
          },
        ];
      }
    } else {
      // Default: one valid medicine
      prescriptionsList = [
        {
          isActive: true,
          isArchived: false,
          Medicines: [
            {
              name: "Paracetamol 500mg",
              genericName: "Paracetamol",
              dosage: "500mg",
              qty: 20,
              unit: "tablets",
              frequency: "QID PRN",
              duration: "5 days",
              PhilHealthData: {
                drugCode: "DRUG-PARA-500",
                genericCode: "GEN-PARA",
              },
            },
          ],
        },
      ];
    }

    let hps: any[] = [];
    if (cfg.physician !== null && cfg.physician?.hasHp !== false) {
      const p = cfg.physician || {};
      hps = [
        {
          HealthCareProvider: {
            User: p.user !== undefined ? p.user : { firstName: "JUAN", lastName: "LUNA" },
            HPProfile: p.hpProfile !== undefined ? p.hpProfile : { title: "DR.", suffix: "MD" },
            ProfessionalDetails:
              p.professionalDetails !== undefined
                ? p.professionalDetails
                : { licenseNumber: "1234567", ptrNumber: "7654321" },
          },
        },
      ];
    }

    return {
      id: 999,
      createdAt,
      caseNumber: cfg.caseNumber !== undefined ? cfg.caseNumber : "INTERNAL-CASE-999",
      konsultaHciCaseNo: cfg.konsultaHciCaseNo !== undefined ? cfg.konsultaHciCaseNo : "KONSULTA-TICKET-HCI-CASE",
      soapTransNo: cfg.soapTransNo !== undefined ? cfg.soapTransNo : "SP1003883120260600001",
      konsultaHciTransNo: cfg.konsultaHciTransNo !== undefined ? cfg.konsultaHciTransNo : null,
      ekasTransactionNumber: cfg.ekasTransactionNumber !== undefined ? cfg.ekasTransactionNumber : null,
      konsultaAtcCode: "ATC-123",
      Clinic: {
        name: "San Juan Health Center",
        ClinicSetting: {
          philhealthAccreditationNumber: "P10038831",
          facilityName: "San Juan Primary Care Facility",
        },
      },
      ClinicPatient: {
        id: 777,
        Patient: {
          dob: new Date("1985-05-15"),
          firstName: "MARIA",
          lastName: "CLARA",
          mobile: "09189876543",
        },
        PhilHealthKonsultaEnlistments: [
          {
            memberPin: "112233445566",
            dependentPin: "",
            hciCaseNo: cfg.hciCaseNo !== undefined ? cfg.hciCaseNo : "TP1003883120260600001",
            profilingTransNo: cfg.profilingTransNo !== undefined ? cfg.profilingTransNo : "PP1003883120260600001",
            atcCode: "ATC-ENLIST",
          },
        ],
      },
      ConsultationTicketHPs: hps,
      ConsultationDiagnoses: [],
      Prescriptions: prescriptionsList,
    };
  };

  const loadPdf = async (base64: string) => {
    return await PDFDocument.load(new Uint8Array(Buffer.from(base64, "base64")));
  };

  // =========================================================================
  // CHALLENGE 1: Issue #514 - Next Dispense Date Edge Cases
  // =========================================================================
  describe("Challenge 1: Issue #514 - Next Dispense Date Edge Cases", () => {
    it("1.1 Leap year: Feb 1, 2024 -> March 2, 2024 (29 days in Feb 2024)", async () => {
      // 2024 is a leap year (29 days in February). Feb 1 + 30 days = March 2.
      const leapFeb1 = new Date("2024-02-01T12:00:00Z");
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({ createdAt: leapFeb1 })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      // In 2024 (leap year): Feb 1 + 30 days:
      // Feb 1 to Feb 29 = 28 days elapsed. Remaining 2 days in March -> 03/02/2024
      // Verified against actual template field name: text_nextDespensDate
      expect(form.getTextField("text_nextDespensDate").getText()).toBe("03/02/2024");
    });

    it("1.2 Leap year: Feb 29, 2024 -> March 30, 2024", async () => {
      const leapFeb29 = new Date("2024-02-29T12:00:00Z");
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({ createdAt: leapFeb29 })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      // Feb 29 + 30 days = March 30, 2024
      expect(form.getTextField("text_nextDespensDate").getText()).toBe("03/30/2024");
    });

    it("1.3 Non-leap year: Feb 1, 2025 -> March 3, 2025 (28 days in Feb 2025)", async () => {
      const nonLeapFeb1 = new Date("2025-02-01T12:00:00Z");
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({ createdAt: nonLeapFeb1 })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      // In 2025 (common year): Feb 1 + 30 days:
      // Feb 1 to Feb 28 = 27 days elapsed. Remaining 3 days in March -> 03/03/2025
      expect(form.getTextField("text_nextDespensDate").getText()).toBe("03/03/2025");
    });

    it("1.4 Leap year 2028: Feb 15, 2028 -> March 16, 2028", async () => {
      const leap2028 = new Date("2028-02-15T12:00:00Z");
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({ createdAt: leap2028 })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      // Feb 15 to Feb 29 = 14 days. 30 - 14 = 16 days into March -> 03/16/2028
      expect(form.getTextField("text_nextDespensDate").getText()).toBe("03/16/2028");
    });

    it("1.5 Year turnover: Dec 15, 2026 -> Jan 14, 2027", async () => {
      const dec15 = new Date("2026-12-15T12:00:00Z");
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({ createdAt: dec15 })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      // Dec 15 to Dec 31 = 16 days. 30 - 16 = 14 days into Jan 2027 -> 01/14/2027
      expect(form.getTextField("text_nextDespensDate").getText()).toBe("01/14/2027");
    });

    it("1.6 Year turnover: Dec 31, 2026 -> Jan 30, 2027", async () => {
      const dec31 = new Date("2026-12-31T12:00:00Z");
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({ createdAt: dec31 })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_nextDespensDate").getText()).toBe("01/30/2027");
    });

    it("1.7 Multiple medicines: nextDispenseDate is populated", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          createdAt: new Date("2026-06-01T12:00:00Z"),
          medicines: [
            { name: "Med A", genericName: "A", dosage: "10mg", qty: 30 },
            { name: "Med B", genericName: "B", dosage: "20mg", qty: 30 },
            { name: "Med C", genericName: "C", dosage: "30mg", qty: 30 },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_nextDespensDate").getText()).toBe("07/01/2026");
    });

    it("1.8 NOMED only (via various NOMED indicators): nextDispenseDate is strictly empty", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          medicines: [
            { name: "NOMED", genericName: "NOMED", drugCode: "NOMED00000000000000000000000" },
            { name: "nomed", genericName: "no-med", genericCode: "NOMED" },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_nextDespensDate").getText() ?? "").toBe("");
    });

    it("1.9 NOMED mixed with real medicine: real medicine takes effect, nextDispenseDate is populated", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          createdAt: new Date("2026-06-01T12:00:00Z"),
          medicines: [
            { name: "NOMED", genericName: "NOMED", drugCode: "NOMED00000" },
            { name: "Losartan 50mg", genericName: "Losartan", dosage: "50mg", qty: 30 },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_nextDespensDate").getText()).toBe("07/01/2026");
      expect(form.getTextField("textarea_rx").getText()).toContain("Losartan 50mg");
      expect(form.getTextField("textarea_rx").getText()).not.toContain("NOMED");
    });

    it("1.10 Empty Prescriptions array and empty Medicines array: nextDispenseDate is empty", async () => {
      // Empty prescriptions array
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({ prescriptions: [] })
      );

      let res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      let pdf = await loadPdf(res.data!.base64);
      expect(pdf.getForm().getTextField("text_nextDespensDate").getText() ?? "").toBe("");

      // Prescriptions with empty Medicines array
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({ prescriptions: [{ Medicines: [] }] })
      );

      res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      pdf = await loadPdf(res.data!.base64);
      expect(pdf.getForm().getTextField("text_nextDespensDate").getText() ?? "").toBe("");
    });
  });

  // =========================================================================
  // CHALLENGE 2: Issue #514 - Attending Physician Credentials Fallback
  // =========================================================================
  describe("Challenge 2: Issue #514 - Physician Credentials Fallback", () => {
    it("2.1 Whitespace-only license and ptr strings ('   ', '\\t\\n'): falls back to '0000000'", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          physician: {
            hasHp: true,
            user: { firstName: "GREGORIO", lastName: "DEL PILAR" },
            hpProfile: { title: "DR.", suffix: "MD" },
            professionalDetails: {
              licenseNumber: "   ",
              ptrNumber: "\t  \n",
            },
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_prcLicense").getText()).toBe("0000000");
      expect(form.getTextField("text_ptr").getText()).toBe("0000000");
    });

    it("2.2 null vs undefined vs empty string license and ptr: all fall back to '0000000'", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          physician: {
            hasHp: true,
            user: { firstName: "ANTONIO", lastName: "LUNA" },
            professionalDetails: {
              licenseNumber: null,
              ptrNumber: undefined,
            },
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_prcLicense").getText()).toBe("0000000");
      expect(form.getTextField("text_ptr").getText()).toBe("0000000");
    });

    it("2.3 Doctor linked but missing User profile: handles gracefully without crashing", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          physician: {
            hasHp: true,
            user: null, // No User profile attached
            hpProfile: { title: "DR.", suffix: "FPSP" },
            professionalDetails: { licenseNumber: "LIC-1122", ptrNumber: "PTR-3344" },
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_physicianName").getText()).toMatch(/DR\.\s+FPSP/);
      expect(form.getTextField("text_prcLicense").getText()).toBe("LIC-1122");
      expect(form.getTextField("text_ptr").getText()).toBe("PTR-3344");
    });

    it("2.4 Doctor linked but missing ProfessionalDetails: license and ptr fall back to '0000000'", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          physician: {
            hasHp: true,
            user: { firstName: "APOLINARIO", lastName: "MABINI" },
            hpProfile: { title: "DR.", suffix: "MD" },
            professionalDetails: null, // No ProfessionalDetails record
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_physicianName").getText()).toMatch(/DR\.\s+APOLINARIO\s+MABINI/);
      expect(form.getTextField("text_prcLicense").getText()).toBe("0000000");
      expect(form.getTextField("text_ptr").getText()).toBe("0000000");
    });

    it("2.5 Doctor linked but missing HPProfile: physicianName still uses User names without crashing", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          physician: {
            hasHp: true,
            user: { firstName: "EMILIO", lastName: "AGUINALDO" },
            hpProfile: null, // No HPProfile record
            professionalDetails: { licenseNumber: "PRC-9999", ptrNumber: "PTR-8888" },
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_physicianName").getText()).toBe("EMILIO AGUINALDO");
      expect(form.getTextField("text_prcLicense").getText()).toBe("PRC-9999");
      expect(form.getTextField("text_ptr").getText()).toBe("PTR-8888");
    });

    it("2.6 No doctor attached (ConsultationTicketHPs empty): fields are strictly blank '' (not '0000000')", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          physician: null, // No doctor linked at all
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_physicianName").getText() ?? "").toBe("");
      expect(form.getTextField("text_prcLicense").getText() ?? "").toBe("");
      expect(form.getTextField("text_ptr").getText() ?? "").toBe("");
    });

    it("2.7 ePresS with NOMED only: physician credentials are intentionally blank '' even if doctor has valid license", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          medicines: [{ name: "NOMED", genericName: "NOMED", drugCode: "NOMED000" }],
          physician: {
            hasHp: true,
            user: { firstName: "ANDRES", lastName: "BONIFACIO" },
            hpProfile: { title: "DR.", suffix: "MD" },
            professionalDetails: { licenseNumber: "VALID-12345", ptrNumber: "VALID-67890" },
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      // Because NOMED on ePresS means no medicines dispensed, physician block must be blank
      expect(form.getTextField("text_physicianName").getText() ?? "").toBe("");
      expect(form.getTextField("text_prcLicense").getText() ?? "").toBe("");
      expect(form.getTextField("text_ptr").getText() ?? "").toBe("");
    });

    it("2.8 eKAS slip (profiling): physician credentials are preserved even when no medicines are prescribed", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          prescriptions: [], // No medicines
          physician: {
            hasHp: true,
            user: { firstName: "MELCHORA", lastName: "AQUINO" },
            hpProfile: { title: "DR.", suffix: "MD" },
            professionalDetails: { licenseNumber: null, ptrNumber: "" }, // empty -> fallback 0000000
          },
        })
      );

      const res = await generateEkasPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      // On eKAS (profiling), attending physician is shown with QA fallback 0000000
      expect(form.getTextField("text_physicianName").getText()).toMatch(/DR\.\s+MELCHORA\s+AQUINO/);
      expect(form.getTextField("text_prcLicense").getText()).toBe("0000000");
      expect(form.getTextField("text_ptr").getText()).toBe("0000000");
    });
  });

  // =========================================================================
  // CHALLENGE 3: Issue #513 - Transaction Header Prefix
  // =========================================================================
  describe("Challenge 3: Issue #513 - Transaction Header Prefix", () => {
    it("3.1 ePresS slip receives SP... transaction number while eKAS receives PP...", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          soapTransNo: "SP1003883120261100099",
          profilingTransNo: "PP1003883120261100088",
        })
      );

      // ePresS must get SP...
      const epresRes = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const epresPdf = await loadPdf(epresRes.data!.base64);
      expect(epresPdf.getForm().getTextField("text_transNo").getText()).toBe("SP1003883120261100099");

      // eKAS must get PP...
      const ekasRes = await generateEkasPdfAction({ ticketId: 999, clinicUid: "c1" });
      const ekasPdf = await loadPdf(ekasRes.data!.base64);
      expect(ekasPdf.getForm().getTextField("text_transNo").getText()).toBe("PP1003883120261100088");
    });

    it("3.2 ePresS slip: soapTransNo is null -> falls back to konsultaHciTransNo", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          soapTransNo: null,
          konsultaHciTransNo: "SP-BACKUP-12345",
          profilingTransNo: "PP1003883120261100088",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      expect(pdf.getForm().getTextField("text_transNo").getText()).toBe("SP-BACKUP-12345");
    });

    it("3.3 ePresS slip: both soapTransNo and konsultaHciTransNo are null -> falls back to '' without crash", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          soapTransNo: null,
          konsultaHciTransNo: null,
          profilingTransNo: "PP1003883120261100088", // ePresS must NOT use profilingTransNo
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      expect(pdf.getForm().getTextField("text_transNo").getText() ?? "").toBe("");
    });

    it("3.4 eKAS slip: profilingTransNo is null -> falls back to case number with P prefix", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          profilingTransNo: null,
          hciCaseNo: "TP1003883120261100077",
        })
      );

      const res = await generateEkasPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      // Replaces leading T with P
      expect(pdf.getForm().getTextField("text_transNo").getText()).toBe("PP1003883120261100077");
    });

    it("3.5 eKAS slip: profilingTransNo, caseNo null -> falls back to soapTransNo or ekasTransactionNumber", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          profilingTransNo: null,
          hciCaseNo: null,
          soapTransNo: null,
          konsultaHciTransNo: null,
          ekasTransactionNumber: "EKAS-FALLBACK-001",
        })
      );

      const res = await generateEkasPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      expect(pdf.getForm().getTextField("text_transNo").getText()).toBe("EKAS-FALLBACK-001");
    });
  });

  // =========================================================================
  // CHALLENGE 4: Issue #509 - Case Number Precedence & Alphanumeric Facility Codes
  // =========================================================================
  describe("Challenge 4: Issue #509 - Case Number Precedence & Alphanumeric Codes", () => {
    it("4.1 Precedence Combo 1: All three present -> enlistment.hciCaseNo wins", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          hciCaseNo: "OFFICIAL-ENLIST-CASE-001",
          konsultaHciCaseNo: "TICKET-KONSULTA-CASE-002",
          caseNumber: "INTERNAL-CASE-003",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);

      expect(pdf.getForm().getTextField("text_caseNo").getText()).toBe("OFFICIAL-ENLIST-CASE-001");
      expect(res.data!.filename).toContain("OFFICIAL-ENLIST-CASE-001");
    });

    it("4.2 Precedence Combo 2: enlistment.hciCaseNo absent -> ticket.konsultaHciCaseNo wins", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          hciCaseNo: null,
          konsultaHciCaseNo: "TICKET-KONSULTA-CASE-002",
          caseNumber: "INTERNAL-CASE-003",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);

      expect(pdf.getForm().getTextField("text_caseNo").getText()).toBe("TICKET-KONSULTA-CASE-002");
      expect(res.data!.filename).toContain("TICKET-KONSULTA-CASE-002");
    });

    it("4.3 Precedence Combo 3: Both hciCaseNo & konsultaHciCaseNo absent -> ticket.caseNumber wins", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          hciCaseNo: null,
          konsultaHciCaseNo: null,
          caseNumber: "INTERNAL-CASE-003",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);

      expect(pdf.getForm().getTextField("text_caseNo").getText()).toBe("INTERNAL-CASE-003");
      expect(res.data!.filename).toContain("INTERNAL-CASE-003");
    });

    it("4.4 Precedence Combo 4: All case numbers absent -> falls back to '' without crash", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          hciCaseNo: null,
          konsultaHciCaseNo: null,
          caseNumber: null,
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);

      expect(pdf.getForm().getTextField("text_caseNo").getText() ?? "").toBe("");
      expect(res.data!.filename).toContain("Form.pdf");
    });

    it("4.5 formatKonsultaHciNumber preserves alphanumeric facility codes with letters and numbers", () => {
      const fixedDate = new Date(2026, 5, 1); // June 2026
      
      // Standard PhilHealth prefix 'P'
      expect(formatKonsultaHciNumber("T", "P10038831", 1, fixedDate)).toBe("TP1003883120260600001");

      // Hospital accreditation code starting with 'H'
      expect(formatKonsultaHciNumber("T", "H91000000", 42, fixedDate)).toBe("TH9100000020260600042");

      // Codes with hyphens/spaces: punctuation stripped, letters preserved
      expect(formatKonsultaHciNumber("R", "P-100-38831", 5, fixedDate)).toBe("RP1003883120260600005");

      // Alphanumeric suffix
      expect(formatKonsultaHciNumber("S", "10038831A", 123, fixedDate)).toBe("S10038831A20260600123");

      // Null or undefined gracefully handled and padded
      expect(formatKonsultaHciNumber("P", undefined as any, 1, fixedDate)).toBe("P00000000020260600001");
      expect(formatKonsultaHciNumber("P", null as any, 1, fixedDate)).toBe("P00000000020260600001");
    });
  });

  // =========================================================================
  // CHALLENGE 5: Issue #236 - AcroForm Interactivity & No Flattening
  // =========================================================================
  describe("Challenge 5: Issue #236 - AcroForm Interactivity & No Flattening", () => {
    it("5.1 AcroForm field textarea_rx is interactive, writable, and NOT read-only in ePresS PDF", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createTicket({
          medicines: [
            {
              name: "Azithromycin 500mg",
              genericName: "Azithromycin",
              dosage: "500mg",
              qty: 3,
              unit: "tablets",
              frequency: "OD",
              duration: "3 days",
            },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      const rxField = form.getTextField("textarea_rx");
      expect(rxField).toBeDefined();

      // Empirical proof: field must NOT be read-only
      expect(rxField.isReadOnly()).toBe(false);

      // Empirical proof: field is writable by downstream clients
      rxField.setText("Empirical modification test");
      expect(rxField.getText()).toBe("Empirical modification test");

      // Form itself must contain active fields (not flattened)
      const fieldCount = form.getFields().length;
      expect(fieldCount).toBeGreaterThan(10);
    });

    it("5.2 AcroForm field textarea_rx is interactive, writable, and NOT read-only in eKAS PDF", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(createTicket());

      const res = await generateEkasPdfAction({ ticketId: 999, clinicUid: "c1" });
      const pdf = await loadPdf(res.data!.base64);
      const form = pdf.getForm();

      const rxField = form.getTextField("textarea_rx");
      expect(rxField).toBeDefined();
      expect(rxField.isReadOnly()).toBe(false);

      // Verify form is interactive
      expect(form.getFields().length).toBeGreaterThan(10);
    });

    it("5.3 Empirical Source Verification: flatten() is NEVER called in ekas.action.ts", () => {
      const filePath = path.join(__dirname, "ekas.action.ts");
      const fileContent = fs.readFileSync(filePath, "utf-8");

      // Regex to assert flatten() is not invoked anywhere in ekas.action.ts
      expect(fileContent).not.toMatch(/\.flatten\s*\(/);
    });
  });
});
