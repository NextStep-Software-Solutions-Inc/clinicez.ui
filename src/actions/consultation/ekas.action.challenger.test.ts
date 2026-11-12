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
import { PDFDocument } from "pdf-lib";
import { format } from "date-fns";
import fs from "fs/promises";
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

describe("Empirical Challenger: ekas.action PDF & AcroForm Robustness Suite", () => {
  const baseTicketDate = new Date("2026-11-12T08:00:00Z");

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCachedSession.mockResolvedValue({
      user: {
        sub: "usr_doc_challenger",
        name: "DR. EMPIRICAL CHALLENGER",
        email: "challenger@example.com",
      },
    });

    mockPrisma.konsultaDiagnosticResult.findMany.mockResolvedValue([]);
  });

  type MockTicketParams = {
    createdAt?: Date;
    caseNumber?: string;
    konsultaHciCaseNo?: string | null;
    enlistmentHciCaseNo?: string | null;
    soapTransNo?: string | null;
    konsultaHciTransNo?: string | null;
    profilingTransNo?: string | null;
    ekasTransactionNumber?: string | null;
    physician?: {
      title?: string;
      firstName?: string;
      lastName?: string;
      suffix?: string;
      licenseNumber?: string | null;
      ptrNumber?: string | null;
    } | null;
    medicines?: Array<{
      name?: string;
      genericName?: string;
      dosage?: string;
      qty?: number | null;
      unit?: string | null;
      frequency?: string | null;
      duration?: string | null;
      PhilHealthData?: {
        drugCode?: string;
        genericCode?: string;
      };
    }>;
  };

  const createMockTicket = (p: MockTicketParams = {}) => {
    const createdAt = p.createdAt ?? baseTicketDate;
    const caseNumber = p.caseNumber ?? "INT-CASE-101";
    const konsultaHciCaseNo = p.konsultaHciCaseNo !== undefined ? p.konsultaHciCaseNo : "TP1003883120261100001";
    const enlistmentHciCaseNo = p.enlistmentHciCaseNo !== undefined ? p.enlistmentHciCaseNo : "TP1003883120261100001";
    const soapTransNo = p.soapTransNo !== undefined ? p.soapTransNo : "SP1003883120261100001";
    const konsultaHciTransNo = p.konsultaHciTransNo !== undefined ? p.konsultaHciTransNo : null;
    const profilingTransNo = p.profilingTransNo !== undefined ? p.profilingTransNo : "PP1003883120261100001";
    const ekasTransactionNumber = p.ekasTransactionNumber !== undefined ? p.ekasTransactionNumber : null;

    const medicines = p.medicines !== undefined
      ? p.medicines
      : [
          {
            name: "Paracetamol 500mg",
            genericName: "Paracetamol",
            dosage: "500mg",
            qty: 10,
            unit: "tablets",
            frequency: "Every 4 hours PRN",
            duration: "3 days",
            PhilHealthData: { drugCode: "MED001", genericCode: "GEN001" },
          },
        ];

    const physician = p.physician !== undefined
      ? p.physician
      : {
          title: "DR.",
          firstName: "EVALUATOR",
          lastName: "CHALLENGER",
          suffix: "MD",
          licenseNumber: "PRC-998877",
          ptrNumber: "PTR-112233",
        };

    return {
      id: 701,
      caseNumber,
      konsultaHciCaseNo,
      soapTransNo,
      konsultaHciTransNo,
      ekasTransactionNumber,
      konsultaAtcCode: "ATC-CHALLENGE",
      createdAt,
      Clinic: {
        name: "PhilHealth Accredited Test Center",
        ClinicSetting: {
          philhealthAccreditationNumber: "P10038831",
          facilityName: "PhilHealth Accredited Facility",
        },
      },
      ClinicPatient: {
        id: 901,
        Patient: {
          dob: new Date("1985-06-15"),
          firstName: "MARIA",
          lastName: "SANTOS",
          mobile: "09181234567",
        },
        PhilHealthKonsultaEnlistments: [
          {
            memberPin: "112233445566",
            dependentPin: "",
            hciCaseNo: enlistmentHciCaseNo,
            profilingTransNo,
            atcCode: "ATC-ENLIST",
          },
        ],
      },
      ConsultationTicketHPs: physician
        ? [
            {
              HealthCareProvider: {
                HPProfile: {
                  title: physician.title ?? "DR.",
                  suffix: physician.suffix ?? "",
                },
                ProfessionalDetails: {
                  licenseNumber: physician.licenseNumber ?? null,
                  ptrNumber: physician.ptrNumber ?? null,
                },
                User: {
                  firstName: physician.firstName ?? "",
                  lastName: physician.lastName ?? "",
                },
              },
            },
          ]
        : [],
      ConsultationDiagnoses: [],
      Prescriptions: [
        {
          isActive: true,
          isArchived: false,
          Medicines: medicines,
        },
      ],
    };
  };

  const parseBase64Pdf = async (base64: string) => {
    const bytes = Buffer.from(base64, "base64");
    return await PDFDocument.load(new Uint8Array(bytes));
  };

  // =========================================================================
  // Test Suite 1: Template Binary Integrity & Field Existence
  // =========================================================================
  describe("Binary Template Verification", () => {
    it("verifies physical existence and field structure of 'ePresS (PC 2024-0013) FILLABLE.pdf'", async () => {
      const templatePath = path.join(process.cwd(), "public", "pdfs", "phr", "ePresS (PC 2024-0013) FILLABLE.pdf");
      const bytes = await fs.readFile(templatePath);
      expect(bytes.length).toBeGreaterThan(0);

      const doc = await PDFDocument.load(new Uint8Array(bytes));
      const form = doc.getForm();
      const fieldNames = form.getFields().map((f) => f.getName());

      // Key fields required by Milestone 2
      expect(fieldNames).toContain("text_caseNo");
      expect(fieldNames).toContain("text_transNo");
      expect(fieldNames).toContain("textarea_rx");
      expect(fieldNames).toContain("text_physicianName");
      expect(fieldNames).toContain("text_prcLicense");
      expect(fieldNames).toContain("text_ptr");

      // Verify the PhilHealth template typo field: text_nextDespensDate
      expect(fieldNames).toContain("text_nextDespensDate");
    });

    it("verifies physical existence and field structure of 'eKAS (PC 2024-0013) FILLABLE.pdf'", async () => {
      const templatePath = path.join(process.cwd(), "public", "pdfs", "phr", "eKAS (PC 2024-0013) FILLABLE.pdf");
      const bytes = await fs.readFile(templatePath);
      expect(bytes.length).toBeGreaterThan(0);

      const doc = await PDFDocument.load(new Uint8Array(bytes));
      const form = doc.getForm();
      const fieldNames = form.getFields().map((f) => f.getName());

      expect(fieldNames).toContain("text_caseNo");
      expect(fieldNames).toContain("text_transNo");
      expect(fieldNames).toContain("text_physicianName");
      expect(fieldNames).toContain("text_prcLicense");
      expect(fieldNames).toContain("text_ptr");
    });
  });

  // =========================================================================
  // Test Suite 2: Dispense Date & Typo Compatibility (Issue #514)
  // =========================================================================
  describe("Dispense Date Computation & Typo Compatibility (#514)", () => {
    it("populates text_nextDespensDate with exactly +30 days when medicines are present", async () => {
      const consultationDate = new Date("2026-03-15T10:00:00Z");
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          createdAt: consultationDate,
          medicines: [
            {
              name: "Amoxicillin 500mg",
              genericName: "Amoxicillin",
              qty: 21,
            },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      // Expected date: 30 days after March 15, 2026 = April 14, 2026
      const expectedDate = format(new Date(consultationDate.getTime() + 30 * 24 * 60 * 60 * 1000), "MM/dd/yyyy");
      expect(expectedDate).toBe("04/14/2026");

      const despensField = form.getTextField("text_nextDespensDate");
      expect(despensField.getText()).toBe("04/14/2026");
    });

    it("handles leap year leap day (Feb 29, 2024 + 30 days = March 30, 2024)", async () => {
      const leapDay = new Date("2024-02-29T09:00:00Z");
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          createdAt: leapDay,
          medicines: [{ name: "Azithromycin 500mg", qty: 3 }],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      const expectedDate = format(new Date(leapDay.getTime() + 30 * 24 * 60 * 60 * 1000), "MM/dd/yyyy");
      expect(expectedDate).toBe("03/30/2024");
      expect(form.getTextField("text_nextDespensDate").getText()).toBe("03/30/2024");
    });

    it("leaves nextDespensDate empty when prescription medicines list is completely empty", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          medicines: [],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      const despensField = form.getTextField("text_nextDespensDate");
      expect(despensField.getText() ?? "").toBe("");
    });

    it("leaves nextDespensDate empty when medicines list contains ONLY NOMED entries", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          medicines: [
            {
              name: "NOMED",
              genericName: "NOMED",
              PhilHealthData: { drugCode: "NOMED0001", genericCode: "NOMED" },
            },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      const despensField = form.getTextField("text_nextDespensDate");
      expect(despensField.getText() ?? "").toBe("");
    });
  });

  // =========================================================================
  // Test Suite 3: Physician Credentials & Fallback Logic (#514)
  // =========================================================================
  describe("Physician Credentials & Fallbacks (#514)", () => {
    it("populates actual doctor license and PTR when available", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          physician: {
            title: "DR.",
            firstName: "CARLOS",
            lastName: "GARCIA",
            suffix: "MD, FPCP",
            licenseNumber: "PRC-0054321",
            ptrNumber: "PTR-9988776",
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_physicianName").getText()).toMatch(/DR\.\s+CARLOS\s+GARCIA/i);
      expect(form.getTextField("text_prcLicense").getText()).toBe("PRC-0054321");
      expect(form.getTextField("text_ptr").getText()).toBe("PTR-9988776");
    });

    it("falls back to QA placeholder '0000000' when doctor is attached but credentials are null, empty, or whitespace", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          physician: {
            title: "DR.",
            firstName: "CARLOS",
            lastName: "GARCIA",
            licenseNumber: null,
            ptrNumber: "   ",
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_prcLicense").getText()).toBe("0000000");
      expect(form.getTextField("text_ptr").getText()).toBe("0000000");
    });

    it("blanks out physician name and credentials completely on ePresS when NOMED is prescribed", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          physician: {
            title: "DR.",
            firstName: "CARLOS",
            lastName: "GARCIA",
            licenseNumber: "PRC-123",
            ptrNumber: "PTR-456",
          },
          medicines: [
            {
              name: "NOMED",
              genericName: "NOMED",
            },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_physicianName").getText() ?? "").toBe("");
      expect(form.getTextField("text_prcLicense").getText() ?? "").toBe("");
      expect(form.getTextField("text_ptr").getText() ?? "").toBe("");
    });

    it("blanks out physician credentials on ePresS when no medicines are prescribed at all", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          physician: {
            title: "DR.",
            firstName: "CARLOS",
            lastName: "GARCIA",
            licenseNumber: "PRC-123",
            ptrNumber: "PTR-456",
          },
          medicines: [],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_physicianName").getText() ?? "").toBe("");
      expect(form.getTextField("text_prcLicense").getText() ?? "").toBe("");
      expect(form.getTextField("text_ptr").getText() ?? "").toBe("");
    });

    it("retains physician information on eKAS slip even if no medicines are prescribed", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          physician: {
            title: "DR.",
            firstName: "CARLOS",
            lastName: "GARCIA",
            licenseNumber: "PRC-123",
            ptrNumber: "PTR-456",
          },
          medicines: [],
        })
      );

      const res = await generateEkasPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      // On eKAS, the doctor who performed consultation/profiling is retained
      expect(form.getTextField("text_physicianName").getText()).toMatch(/DR\.\s+CARLOS\s+GARCIA/i);
      expect(form.getTextField("text_prcLicense").getText()).toBe("PRC-123");
      expect(form.getTextField("text_ptr").getText()).toBe("PTR-456");
    });
  });

  // =========================================================================
  // Test Suite 4: Transaction Number Header Prefix Precedence (#513)
  // =========================================================================
  describe("Transaction Number Header Precedence (#513)", () => {
    it("ePresS slip header strictly uses soapTransNo (SP...) even when profilingTransNo (PP...) exists", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          soapTransNo: "SP1003883120261100099",
          profilingTransNo: "PP1003883120261100099",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_transNo").getText()).toBe("SP1003883120261100099");
    });

    it("ePresS slip header falls back to konsultaHciTransNo when soapTransNo is null", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          soapTransNo: null,
          konsultaHciTransNo: "SP1003883120261100077",
          profilingTransNo: "PP1003883120261100099",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_transNo").getText()).toBe("SP1003883120261100077");
    });

    it("eKAS slip header prioritizes profilingTransNo (PP...) over soapTransNo (SP...)", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          soapTransNo: "SP1003883120261100099",
          profilingTransNo: "PP1003883120261100099",
        })
      );

      const res = await generateEkasPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_transNo").getText()).toBe("PP1003883120261100099");
    });

    it("eKAS slip header derives profiling number with P prefix from case number if profilingTransNo is missing", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          enlistmentHciCaseNo: "TP1003883120261100001",
          profilingTransNo: null,
          soapTransNo: null,
        })
      );

      const res = await generateEkasPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_transNo").getText()).toBe("PP1003883120261100001");
    });
  });

  // =========================================================================
  // Test Suite 5: Case Number Precedence & Download Filenames (#509)
  // =========================================================================
  describe("Case Number Precedence Hierarchy (#509)", () => {
    it("Priority 1: enlistment.hciCaseNo overrides both ticket.konsultaHciCaseNo and ticket.caseNumber", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          enlistmentHciCaseNo: "TP1003883120261100001",
          konsultaHciCaseNo: "KONSULTA-HCI-CASE-2",
          caseNumber: "INTERNAL-CASE-3",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_caseNo").getText()).toBe("TP1003883120261100001");
      expect(res.data!.filename).toContain("TP1003883120261100001");
      expect(res.data!.filename).not.toContain("INTERNAL-CASE-3");
    });

    it("Priority 2: ticket.konsultaHciCaseNo is used when enlistment.hciCaseNo is absent", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          enlistmentHciCaseNo: null,
          konsultaHciCaseNo: "TP1003883120261100002",
          caseNumber: "INTERNAL-CASE-3",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_caseNo").getText()).toBe("TP1003883120261100002");
      expect(res.data!.filename).toContain("TP1003883120261100002");
    });

    it("Priority 3: ticket.caseNumber is used when both PhilHealth case numbers are absent", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          enlistmentHciCaseNo: null,
          konsultaHciCaseNo: null,
          caseNumber: "INTERNAL-CASE-999",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_caseNo").getText()).toBe("INTERNAL-CASE-999");
      expect(res.data!.filename).toContain("INTERNAL-CASE-999");
    });

    it("Priority 4: falls back to empty string / 'Form' filename when no case numbers exist", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          enlistmentHciCaseNo: null,
          konsultaHciCaseNo: null,
          caseNumber: "",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      expect(form.getTextField("text_caseNo").getText() ?? "").toBe("");
      expect(res.data!.filename).toBe("EPRESS_MARIA_SANTOS_Form.pdf");
    });
  });

  // =========================================================================
  // Test Suite 6: Interactive Fillable Prescription Text (#236)
  // =========================================================================
  describe("Interactive Prescription Textarea & Formatting (#236)", () => {
    it("formats multiple medicines with dosage, quantity, unit, and sig correctly", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          medicines: [
            {
              genericName: "Amoxicillin",
              name: "Amoxicillin 500mg",
              dosage: "500mg",
              qty: 21,
              unit: "capsule",
              frequency: "1 capsule 3x a day",
              duration: "7 days",
            },
            {
              genericName: "Paracetamol",
              name: "Paracetamol 500mg",
              dosage: "500mg",
              qty: 10,
              unit: "tablet",
              frequency: "Every 4 hours PRN",
              duration: null,
            },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      const rxField = form.getTextField("textarea_rx");
      const rxText = rxField.getText();

      expect(rxText).toContain("Amoxicillin 500mg - 21 capsule\nSig: 1 capsule 3x a day for 7 days");
      expect(rxText).toContain("Paracetamol 500mg - 10 tablet\nSig: Every 4 hours PRN");
      // Check that duration: null did NOT produce "for null"
      expect(rxText).not.toContain("for null");

      // Verify interactive non-flattened state
      expect(form.getFields().length).toBeGreaterThan(0);
      expect(rxField.isReadOnly()).toBe(false);
    });

    it("handles null/undefined qty safely defaulting to 1 tab", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          medicines: [
            {
              genericName: "Cetirizine",
              name: "Cetirizine 10mg",
              dosage: "10mg",
              qty: null,
              unit: null,
              frequency: "Once daily at bedtime",
              duration: "",
            },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 701, clinicUid: "clinic-1" });
      const doc = await parseBase64Pdf(res.data!.base64);
      const form = doc.getForm();

      const rxText = form.getTextField("textarea_rx").getText();
      expect(rxText).toContain("Cetirizine 10mg - 1 tabs");
      expect(rxText).not.toContain("null");
    });
  });
});
