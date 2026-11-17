/**
 * @jest-environment node
 */

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
    konsultaBatchPatient: {
      findMany: jest.fn(),
    },
    konsultaBatchReport: {
      findMany: jest.fn(),
    },
    konsultaBatch: {
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
    konsultaBatchPatient: {
      findMany: jest.fn(),
    },
    konsultaBatchReport: {
      findMany: jest.fn(),
    },
    konsultaBatch: {
      findMany: jest.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { generateEkasPdfAction, generateEpressPdfAction } from "./ekas.action";
import { formatPhilHealthAge } from "@/lib/philhealth-yakap/date-utils";
import { PDFDocument, PDFDict, PDFName, PDFRawStream, StandardFonts, decodePDFRawStream } from "pdf-lib";
import { format } from "date-fns";

const mockPrisma = prisma as unknown as {
  consultationTicket: {
    findUnique: jest.Mock;
  };
  konsultaDiagnosticResult: {
    findMany: jest.Mock;
  };
  konsultaBatchPatient: {
    findMany: jest.Mock;
  };
  konsultaBatchReport: {
    findMany: jest.Mock;
  };
  konsultaBatch: {
    findMany: jest.Mock;
  };
};

const mockGetCachedSession = getCachedSession as unknown as jest.Mock;

describe("ekas.action: PDF Generation (eKAS & ePresS)", () => {
  const baseTicketDate = new Date("2026-11-12T00:00:00Z");

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCachedSession.mockResolvedValue({
      user: {
        sub: "usr_admin_1",
        name: "DR. CLINIC DOCTOR",
        email: "doctor@example.com",
      },
    });

    mockPrisma.konsultaDiagnosticResult.findMany.mockResolvedValue([]);
    mockPrisma.konsultaBatchPatient.findMany.mockResolvedValue([]);
    mockPrisma.konsultaBatchReport.findMany.mockResolvedValue([]);
    mockPrisma.konsultaBatch.findMany.mockResolvedValue([]);
  });

  type BuildTicketOptions = {
    hasMedicines?: boolean;
    isNomedOnly?: boolean;
    medicines?: Array<{
      name: string;
      genericName: string;
      dosage: string;
      qty: number;
      unit: string;
      frequency: string;
      duration?: string;
      philHealthData?: {
        drugCode?: string;
        genericCode?: string;
      };
    }>;
    physician?: {
      title?: string;
      firstName?: string;
      lastName?: string;
      suffix?: string;
      licenseNumber?: string | null;
      ptrNumber?: string | null;
    } | null;
    caseNumber?: string;
    hciCaseNo?: string | null;
    soapTransNo?: string;
    profilingTransNo?: string | null;
    createdAt?: Date;
    dob?: Date | null;
  };

  const createMockTicket = (options: BuildTicketOptions = {}) => {
    const createdAt = options.createdAt ?? baseTicketDate;
    const dob = options.dob !== undefined ? options.dob : new Date("1990-01-01");
    const caseNumber = options.caseNumber ?? "INT-CASE-101";
    const hciCaseNo = options.hciCaseNo !== undefined ? options.hciCaseNo : "TP1003883120261100001";
    const soapTransNo = options.soapTransNo ?? "SP1003883120261100001";
    const profilingTransNo = options.profilingTransNo !== undefined ? options.profilingTransNo : "PP1003883120261100001";

    let medicinesList: Array<Record<string, unknown>> = [];
    if (options.hasMedicines !== false) {
      if (options.isNomedOnly) {
        medicinesList = [
          {
            name: "NOMED",
            genericName: "NOMED",
            dosage: "",
            qty: 0,
            unit: "",
            frequency: "",
            duration: "",
            PhilHealthData: {
              drugCode: "NOMED00000000000000000000000",
              genericCode: "NOMED",
            },
          },
        ];
      } else if (options.medicines) {
        medicinesList = options.medicines.map((m) => ({
          name: m.name,
          genericName: m.genericName,
          dosage: m.dosage,
          qty: m.qty,
          unit: m.unit,
          frequency: m.frequency,
          duration: m.duration || "",
          PhilHealthData: m.philHealthData || {
            drugCode: "DRUG123",
            genericCode: "GEN123",
          },
        }));
      } else {
        medicinesList = [
          {
            name: "Amoxicillin 500mg",
            genericName: "Amoxicillin",
            dosage: "500mg",
            qty: 21,
            unit: "capsules",
            frequency: "TID",
            duration: "7 days",
            PhilHealthData: {
              drugCode: "DRUG-AMOX-500",
              genericCode: "GEN-AMOX",
            },
          },
        ];
      }
    }

    const physician = options.physician !== undefined ? options.physician : {
      title: "DR.",
      firstName: "ALICE",
      lastName: "SMITH",
      suffix: "MD",
      licenseNumber: "1234567",
      ptrNumber: "7654321",
    };

    return {
      id: 101,
      clinicId: 1,
      caseNumber,
      konsultaHciCaseNo: hciCaseNo,
      soapTransNo,
      konsultaAtcCode: "ATC001",
      createdAt,
      Clinic: {
        name: "Test Health Clinic",
        ClinicSetting: {
          philhealthAccreditationNumber: "P10038831",
          facilityName: "Test Health Facility",
        },
      },
      ClinicPatient: {
        id: 501,
        Patient: {
          dob,
          firstName: "JUAN",
          lastName: "DELA CRUZ",
          mobile: "09171234567",
        },
        PhilHealthKonsultaEnlistments: [
          {
            memberPin: "123456789012",
            dependentPin: "",
            hciCaseNo,
            profilingTransNo,
            atcCode: "WALKEDIN",
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
      ConsultationDiagnoses: [
        {
          id: 1,
          createdAt,
          HealthCareProvider: {
            User: { firstName: "ALICE", lastName: "SMITH" },
          },
        },
      ],
      Prescriptions: [
        {
          isActive: true,
          isArchived: false,
          Medicines: medicinesList,
        },
      ],
    };
  };

  const loadPdfFromBase64 = async (base64: string) => {
    const pdfBytes = Buffer.from(base64, "base64");
    return await PDFDocument.load(new Uint8Array(pdfBytes));
  };

  // =========================================================================
  // TIER 1: Feature Coverage (Isolation / Happy-Path)
  // =========================================================================
  describe("Tier 1: Feature Coverage", () => {
    it("Feature #514: populates nextDispenseDate with +30 days (MM/dd/yyyy) on ePresS slip when medicines exist", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          createdAt: baseTicketDate,
          hasMedicines: true,
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      const expectedDate = format(
        new Date(baseTicketDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        "MM/dd/yyyy"
      );

      // Check AcroForm field text_nextDespensDate (template spelling)
      const dateField = form.getTextField("text_nextDespensDate");
      expect(dateField.getText()).toBe(expectedDate);
    });

    it("Feature #514: populates empty string nextDispenseDate when no medicines are prescribed", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          hasMedicines: false,
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      const dateField = form.getTextField("text_nextDespensDate");
      expect(dateField.getText() ?? "").toBe("");
    });

    it("Feature #514: populates attending physician credentials (licenseNumber and ptrNumber) on ePresS slip", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          physician: {
            title: "DR.",
            firstName: "ALICE",
            lastName: "SMITH",
            suffix: "MD",
            licenseNumber: "PRC-123456",
            ptrNumber: "PTR-789012",
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_physicianName").getText()).toMatch(/DR\.\s+ALICE\s+SMITH/i);
      expect(form.getTextField("text_prcLicense").getText()).toBe("PRC-123456");
      expect(form.getTextField("text_ptr").getText()).toBe("PTR-789012");
    });

    it("Feature #514: falls back to QA placeholder '0000000' when doctor is linked but license/PTR are empty", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          physician: {
            title: "DR.",
            firstName: "ALICE",
            lastName: "SMITH",
            licenseNumber: null,
            ptrNumber: "",
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_prcLicense").getText()).toBe("0000000");
      expect(form.getTextField("text_ptr").getText()).toBe("0000000");
    });

    it("Feature #513: ePresS slip header transaction number reflects soapTransNo (SP...)", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          soapTransNo: "SP1003883120261100001",
          profilingTransNo: "PP1003883120261100001",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_transNo").getText()).toBe("SP1003883120261100001");
    });

    it("Feature #513: eKAS slip header transaction number reflects profilingTransNo (PP...)", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          soapTransNo: "SP1003883120261100001",
          profilingTransNo: "PP1003883120261100001",
        })
      );

      const res = await generateEkasPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_transNo").getText()).toBe("PP1003883120261100001");
    });

    it("Feature #509: official PhilHealth case number (enlistment.hciCaseNo) takes precedence over internal caseNumber", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          caseNumber: "INTERNAL-CASE-999",
          hciCaseNo: "TP1003883120261100001",
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      // Case number in form field
      expect(form.getTextField("text_caseNo").getText()).toBe("TP1003883120261100001");

      // Case number in downloaded filename
      expect(res.data!.filename).toContain("TP1003883120261100001");
      expect(res.data!.filename).not.toContain("INTERNAL-CASE-999");
    });

    it("Feature #236: populates interactive fillable prescription text in textarea_rx without flattening", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          medicines: [
            {
              name: "Amoxicillin 500mg",
              genericName: "Amoxicillin",
              dosage: "500mg",
              qty: 21,
              unit: "capsule",
              frequency: "TID",
              duration: "7 days",
            },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      const rxField = form.getTextField("textarea_rx");
      expect(rxField).toBeDefined();
      expect(rxField.getText()).toContain("Amoxicillin 500mg");
      expect(rxField.getText()).toContain("21 capsule");
      expect(rxField.getText()).toContain("Sig: TID for 7 days");

      // Verify form is interactive (not flattened)
      expect(form.getFields().length).toBeGreaterThan(0);
      expect(rxField.isReadOnly()).toBe(false);
    });
  });

  // =========================================================================
  // TIER 2: Boundary & Corner Cases
  // =========================================================================
  describe("Tier 2: Boundary & Corner Cases", () => {
    it("Boundary #514: NOMED medicine prescription leaves nextDispenseDate empty and blanks physician credentials on ePresS", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          isNomedOnly: true,
          physician: {
            title: "DR.",
            firstName: "ALICE",
            lastName: "SMITH",
            licenseNumber: "1234567",
            ptrNumber: "7654321",
          },
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_nextDespensDate").getText() ?? "").toBe("");
      expect(form.getTextField("text_physicianName").getText() ?? "").toBe("");
      expect(form.getTextField("text_prcLicense").getText() ?? "").toBe("");
      expect(form.getTextField("text_ptr").getText() ?? "").toBe("");
    });

    it("Boundary #509: falls back to internal ticket.caseNumber when enlistment hciCaseNo is absent", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          caseNumber: "FALLBACK-CASE-888",
          hciCaseNo: null,
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_caseNo").getText()).toBe("FALLBACK-CASE-888");
      expect(res.data!.filename).toContain("FALLBACK-CASE-888");
    });

    it("Boundary #513: eKAS falls back to profiling number derived from case number when profilingTransNo is null", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          hciCaseNo: "TP1003883120261100001",
          profilingTransNo: null,
        })
      );

      const res = await generateEkasPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_transNo").getText()).toMatch(/^P/);
    });
  });

  // =========================================================================
  // TIER 3: Cross-Feature Integration
  // =========================================================================
  describe("Tier 3: Cross-Feature Integration", () => {
    it("Cross-Feature: ePresS PDF populates official case number, SP transaction number, +30 days dispense date, doctor credentials, and interactive prescription text simultaneously", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          createdAt: baseTicketDate,
          caseNumber: "INT-CASE-101",
          hciCaseNo: "TP1003883120261100001",
          soapTransNo: "SP1003883120261100001",
          physician: {
            title: "DR.",
            firstName: "GABRIEL",
            lastName: "REYES",
            suffix: "FPCP",
            licenseNumber: "0099887",
            ptrNumber: "7766554",
          },
          medicines: [
            {
              name: "Co-Amoxiclav 625mg",
              genericName: "Co-Amoxiclav",
              dosage: "625mg",
              qty: 14,
              unit: "tablets",
              frequency: "BID",
              duration: "7 days",
            },
          ],
        })
      );

      const res = await generateEpressPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      // Case number
      expect(form.getTextField("text_caseNo").getText()).toBe("TP1003883120261100001");
      expect(res.data!.filename).toBe("EPRESS_JUAN_DELA_CRUZ_TP1003883120261100001.pdf");

      // Transaction number
      expect(form.getTextField("text_transNo").getText()).toBe("SP1003883120261100001");

      // Dispense date
      expect(form.getTextField("text_nextDespensDate").getText()).toBe("12/12/2026");

      // Physician
      expect(form.getTextField("text_physicianName").getText()).toMatch(/DR\.\s+GABRIEL\s+REYES/i);
      expect(form.getTextField("text_prcLicense").getText()).toBe("0099887");
      expect(form.getTextField("text_ptr").getText()).toBe("7766554");

      // Interactive prescription
      expect(form.getTextField("textarea_rx").getText()).toContain("Co-Amoxiclav 625mg");
      expect(form.getFields().length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // TIER 4: Real-World Workflow Scenarios
  // =========================================================================
  describe("Tier 4: Real-World Workflow Scenarios", () => {
    it("Scenario: Generates complete eKAS PDF for First Patient Encounter profiling", async () => {
      mockPrisma.consultationTicket.findUnique.mockResolvedValue(
        createMockTicket({
          hciCaseNo: "TP1003883120261100001",
          profilingTransNo: "PP1003883120261100001",
          physician: {
            title: "DR.",
            firstName: "ALICE",
            lastName: "SMITH",
            licenseNumber: "1234567",
            ptrNumber: "7654321",
          },
        })
      );

      const res = await generateEkasPdfAction({ ticketId: 101, clinicUid: "clinic-1" });
      expect(res.data).toBeDefined();
      expect(res.data!.filename).toBe("EKAS_JUAN_DELA_CRUZ_TP1003883120261100001.pdf");

      const pdf = await loadPdfFromBase64(res.data!.base64);
      const form = pdf.getForm();

      expect(form.getTextField("text_caseNo").getText()).toBe("TP1003883120261100001");
      expect(form.getTextField("text_transNo").getText()).toBe("PP1003883120261100001");
      expect(form.getTextField("text_physicianName").getText()).toMatch(/DR\.\s+ALICE\s+SMITH/i);
    });
  });

  // =========================================================================
  // Issue #518: Full XML Format Patient Age (YR(S), MO(S), DAY(S))
  // =========================================================================
  describe("Issue #518: Patient Age Full Format on eKAS & ePresS PDFs", () => {
    const assertPatientAgeAppearanceFit = async (pdf: PDFDocument, expectedAge: string) => {
      const form = pdf.getForm();
      const ageField = form.getTextField("text_patientAge");
      expect(ageField.getText()).toBe(expectedAge);

      // Verify /DA sets fontSize 7 via ageFontSize when age.length > 5
      expect(ageField.acroField.getDefaultAppearance()).toContain("/Helv 7 Tf");

      // Inspect the visible widget (eKAS uses widgets[0], ePresS uses widgets[1])
      const widgets = ageField.acroField.getWidgets();
      const visibleWidget = widgets.find((w) => w.getRectangle().width > 0);
      expect(visibleWidget).toBeDefined();

      const rect = visibleWidget!.getRectangle();
      expect(rect.width).toBeCloseTo(78.66, 1);

      const apDict = visibleWidget!.dict.lookup(PDFName.of("AP"), PDFDict);
      const normalAp = apDict.lookup(PDFName.of("N"));
      expect(normalAp).toBeInstanceOf(PDFRawStream);

      const streamText = Buffer.from(
        decodePDFRawStream(normalAp as PDFRawStream).decode()
      ).toString("latin1");

      // Confirm pdf-lib auto-scaled single-line appearance stream fits inside 78.66pt width
      const fontMatch = streamText.match(/\/Helvetica\s+(\d+(?:\.\d+)?)\s+Tf/);
      expect(fontMatch).not.toBeNull();
      const renderedFontSize = parseFloat(fontMatch![1]);
      expect(renderedFontSize).toBeLessThanOrEqual(7);
      expect(renderedFontSize).toBeGreaterThan(0);

      const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
      const renderedWidth = helvetica.widthOfTextAtSize(expectedAge, renderedFontSize);
      expect(renderedWidth).toBeLessThanOrEqual(rect.width);
    };

    it.each([
      { label: "eKAS", action: generateEkasPdfAction, expectedTransNo: "PP1003883120261100001" },
      { label: "ePresS", action: generateEpressPdfAction, expectedTransNo: "SP1003883120261100001" },
    ])(
      "$label falls back to full formatPhilHealthAge(dob) when no XML batch payload exists",
      async ({ action, expectedTransNo }) => {
        const dob = new Date("1990-01-01");
        const expectedAge = formatPhilHealthAge(dob)!;
        expect(expectedAge).toMatch(/^\d+ YR\(S\), \d+ MO\(S\), \d+ DAY\(S\)$/);

        mockPrisma.consultationTicket.findUnique.mockResolvedValue(createMockTicket({ dob }));

        const res = await action({ ticketId: 101, clinicUid: "clinic-1" });
        expect(res.data).toBeDefined();

        const pdf = await loadPdfFromBase64(res.data!.base64);
        const form = pdf.getForm();
        expect(form.getTextField("text_transNo").getText()).toBe(expectedTransNo);
        expect(form.getTextField("text_caseNo").getText()).toBe("TP1003883120261100001");

        await assertPatientAgeAppearanceFit(pdf, expectedAge);
      }
    );

    it.each([
      { label: "eKAS", action: generateEkasPdfAction, expectedTransNo: "PP1003883120261100001" },
      { label: "ePresS", action: generateEpressPdfAction, expectedTransNo: "SP1003883120261100001" },
    ])(
      "$label prefers XML pPatientAge from KonsultaBatchPatient while preserving text_transNo and text_caseNo",
      async ({ action, expectedTransNo }) => {
        const xmlAge = "42 YR(S), 11 MO(S), 29 DAY(S)";
        mockPrisma.consultationTicket.findUnique.mockResolvedValue(createMockTicket());
        mockPrisma.konsultaBatchPatient.findMany.mockResolvedValue([
          {
            Batch: {
              xmlPayload: `<PCB><PROFILING><PROFILE pHciCaseNo="TP1003883120261100001" pHciTransNo="PP999999" pPatientPin="123456789012" pPatientAge="${xmlAge}" /></PROFILING></PCB>`,
            },
          },
        ]);

        const res = await action({ ticketId: 101, clinicUid: "clinic-1" });
        expect(res.data).toBeDefined();

        const pdf = await loadPdfFromBase64(res.data!.base64);
        const form = pdf.getForm();
        expect(form.getTextField("text_transNo").getText()).toBe(expectedTransNo);
        expect(form.getTextField("text_caseNo").getText()).toBe("TP1003883120261100001");

        await assertPatientAgeAppearanceFit(pdf, xmlAge);
      }
    );

    it.each([
      {
        label: "eKAS via KonsultaBatchReport",
        action: generateEkasPdfAction,
        source: "report" as const,
        expectedTransNo: "PP1003883120261100001",
      },
      {
        label: "ePresS via KonsultaBatch",
        action: generateEpressPdfAction,
        source: "batch" as const,
        expectedTransNo: "SP1003883120261100001",
      },
    ])(
      "$label extracts XML pPatientAge from fallback batch tables ($source)",
      async ({ action, source, expectedTransNo }) => {
        const xmlAge = "35 YR(S), 7 MO(S), 14 DAY(S)";
        const payload = `<PCB><SOAPS><SOAP pHciCaseNo="TP1003883120261100001" pHciTransNo="SP999999" pPatientPin="123456789012" pPatientAge="${xmlAge}" /></SOAPS></PCB>`;

        mockPrisma.consultationTicket.findUnique.mockResolvedValue(createMockTicket());
        if (source === "report") {
          mockPrisma.konsultaBatchReport.findMany.mockResolvedValue([{ xmlPayload: payload }]);
        } else {
          mockPrisma.konsultaBatch.findMany.mockResolvedValue([{ xmlPayload: payload }]);
        }

        const res = await action({ ticketId: 101, clinicUid: "clinic-1" });
        expect(res.data).toBeDefined();

        const pdf = await loadPdfFromBase64(res.data!.base64);
        const form = pdf.getForm();
        expect(form.getTextField("text_transNo").getText()).toBe(expectedTransNo);
        await assertPatientAgeAppearanceFit(pdf, xmlAge);
      }
    );

    it.each([
      { label: "eKAS", action: generateEkasPdfAction },
      { label: "ePresS", action: generateEpressPdfAction },
    ])(
      "$label falls back to formatPhilHealthAge(dob) when XML pPatientAge lacks 'YR(S)'",
      async ({ action }) => {
        const dob = new Date("1990-01-01");
        const expectedAge = formatPhilHealthAge(dob)!;

        mockPrisma.consultationTicket.findUnique.mockResolvedValue(createMockTicket({ dob }));
        mockPrisma.konsultaBatchPatient.findMany.mockResolvedValue([
          {
            Batch: {
              xmlPayload: `<PCB><PROFILING><PROFILE pPatientPin="123456789012" pPatientAge="42" /></PROFILING></PCB>`,
            },
          },
        ]);

        const res = await action({ ticketId: 101, clinicUid: "clinic-1" });
        expect(res.data).toBeDefined();

        const pdf = await loadPdfFromBase64(res.data!.base64);
        const form = pdf.getForm();
        expect(form.getTextField("text_patientAge").getText()).toBe(expectedAge);
      }
    );
  });
});
