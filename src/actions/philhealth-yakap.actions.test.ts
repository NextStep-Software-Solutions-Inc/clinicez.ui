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

// Mock sequence generator service
jest.mock("@/services/sequence-generator.service", () => ({
  generatePhilHealthKonsultaTransactionNumber: jest.fn().mockResolvedValue("TP1003883120261100001"),
}));

// Mock recommended diagnostic services
jest.mock("./consultation/konsulta-recommended-services.action", () => ({
  getKonsultaRecommendedService: jest.fn().mockResolvedValue({
    philhealthDiagnosticIds: [],
  }),
}));

// Mock konsulta report helpers
jest.mock("@/actions/clinics/konsulta-report.action", () => ({
  resolvePrincipalMembersByPins: jest.fn().mockResolvedValue(new Map()),
}));

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    clinicSetting: {
      findFirst: jest.fn(),
    },
    clinic: {
      findUnique: jest.fn(),
    },
    konsultaBatchReport: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    diagnosticProcedure: {
      findMany: jest.fn(),
    },
    konsultaDiagnosticResult: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock("@lib/prisma", () => ({
  __esModule: true,
  default: {
    clinicSetting: {
      findFirst: jest.fn(),
    },
    clinic: {
      findUnique: jest.fn(),
    },
    konsultaBatchReport: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    diagnosticProcedure: {
      findMany: jest.fn(),
    },
    konsultaDiagnosticResult: {
      findMany: jest.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { generateBatchXmlAction } from "./philhealth-yakap.actions";

const mockPrisma = prisma as unknown as {
  clinicSetting: {
    findFirst: jest.Mock;
  };
  clinic: {
    findUnique: jest.Mock;
  };
  konsultaBatchReport: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  diagnosticProcedure: {
    findMany: jest.Mock;
  };
  konsultaDiagnosticResult: {
    findMany: jest.Mock;
  };
};

const mockGetCachedSession = getCachedSession as unknown as jest.Mock;

describe("philhealth-yakap.actions: generateBatchXmlAction", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      PHILHEALTH_KONSULTA_CERT_ID: "CERT-TEST-12345",
      PHILHEALTH_KONSULTA_CIPHER_KEY: "CIPHERKEY12345678",
    };

    mockGetCachedSession.mockResolvedValue({
      user: {
        sub: "usr_doc_1",
        name: "DR. SESSION DOCTOR",
        given_name: "SESSION",
        family_name: "DOCTOR",
        email: "doctor@example.com",
      },
    });

    mockPrisma.clinicSetting.findFirst.mockResolvedValue({
      philhealthAccreditationNumber: "P10038831",
      philhealthYakapUsername: "yakap_user",
      philhealthYakapPassword: "yakap_password",
      philhealthYakapPmccNumber: "PMCC01",
    });

    mockPrisma.clinic.findUnique.mockResolvedValue({
      id: 1,
      clinicUid: "clinic-test-123",
    });

    mockPrisma.diagnosticProcedure.findMany.mockResolvedValue([]);
    mockPrisma.konsultaDiagnosticResult.findMany.mockResolvedValue([]);
    mockPrisma.konsultaBatchReport.update.mockResolvedValue({ id: "batch-1" });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  type BuildBatchOptions = {
    tagging?: "1" | "2";
    transmittalNo?: string;
    medicines?: Array<{
      id?: number;
      name?: string;
      genericName?: string;
      brandName?: string;
      dosage?: string;
      frequency?: string;
      unit?: string;
      qty?: number;
      philHealthData?: Record<string, unknown> | null;
    }>;
    physician?: {
      title?: string;
      firstName?: string;
      lastName?: string;
      suffix?: string;
    } | null;
    vitals?: {
      temp?: number;
      height?: number;
      weight?: number;
      bmi?: number;
      bpSystolic?: number;
      bpDiastolic?: number;
      pulseRate?: number;
      respRate?: number;
    };
    diagnosticResults?: Array<{
      id: number;
      hciTransNo: string | null;
      resultType: string;
      resultData?: Record<string, unknown>;
    }>;
  };

  const createMockBatch = (options: BuildBatchOptions = {}) => {
    const tagging = options.tagging ?? "2";
    const medicines = options.medicines ?? [
      {
        id: 1,
        name: "Amoxicillin 500mg",
        genericName: "Amoxicillin",
        dosage: "500mg",
        frequency: "TID",
        unit: "capsule",
        qty: 21,
        philHealthData: {
          drugCode: "DRUG-AMOX-500",
          genericCode: "GEN-AMOX",
          saltCode: "SALT-01",
          strengthCode: "STR-500",
          formCode: "FORM-CAP",
          unitCode: "UNIT-MG",
          packageCode: "PKG-BOX",
          category: "ANTI-INFECTIVES",
          otherMedicine: "",
          othMedDrugGrouping: "ANTIBIOTICS",
          route: "ORAL",
          actualUnitPrice: "15.00",
          totalAmtPrice: "315.00",
        },
      },
    ];

    const physician = options.physician !== undefined ? options.physician : {
      title: "DR.",
      firstName: "ALICE",
      lastName: "SMITH",
      suffix: "MD",
    };

    const vitals = options.vitals ?? {
      bpSystolic: 120,
      bpDiastolic: 80,
      pulseRate: 72,
      respRate: 18,
      temp: 37.2,
      height: 170,
      weight: 70,
      bmi: 24.22,
    };

    return {
      id: "batch-test-1",
      clinicId: 1,
      tagging,
      status: "DRAFT",
      transmittalNo: options.transmittalNo ?? "TP1003883120261100001",
      BatchPatients: [
        {
          isSelected: true,
          selectedTicketIds: [101],
          ClinicPatient: {
            id: 501,
            PhilHealthKonsultaEnlistments: [
              {
                id: 1,
                year: 2026,
                status: "ACTIVE",
                hciCaseNo: "TP1003883120261100001",
                enlistmentTransNo: "EP1003883120261100001",
                profilingTransNo: "PP1003883120261100001",
                atcCode: "WALKEDIN",
                isWalkedIn: true,
              },
            ],
            Patient: {
              id: 201,
              firstName: "JUAN",
              lastName: "DELA CRUZ",
              middleName: "SANTOS",
              suffix: "",
              dob: new Date("1990-01-01"),
              gender: "MALE",
              mobile: "09171234567",
              telephone: "",
              bloodType: "O_POSITIVE",
              PhilHealthRecords: [
                {
                  pin: "123456789012",
                  memberType: "MM",
                  principalMemberPin: "123456789012",
                },
              ],
              MedicalHistories: [],
              FamilyMedicalHistories: [],
              SurgicalHistories: [],
              PersonalHistory: null,
              ObGyneHistory: null,
              UserVaccinations: [],
              UserAllergies: [],
              UserDisabilities: [],
              VitalSigns: [
                {
                  ...vitals,
                  visualAcuityLeft: "20/20",
                  visualAcuityRight: "20/20",
                  consultationTicketId: 101,
                  length: null,
                  headCircumference: null,
                  skinfoldThickness: null,
                  waistCircumference: null,
                  hipCircumference: null,
                  limbCircumference: null,
                  midUpperArmCircumference: null,
                  zScore: null,
                },
              ],
              PhysicalExaminations: [],
              NcdQuestionnaire: null,
            },
            ConsultationTickets: [
              {
                id: 101,
                subject: "Consultation 101",
                soapTransNo: "SP1003883120261100001",
                caseNumber: "CASE-101",
                createdAt: new Date("2026-11-12T00:00:00Z"),
                isPhilHealthKonsulta: true,
                konsultaAtcCode: "ATC001",
                konsultaIsWalkedIn: true,
                konsultaCoPay: 0,
                konsultaRecommendedDiagnosticOptions: null,
                DiagnosticRequests: [],
                ConsultationNotes: [],
                ConsultationDiagnoses: [{ icd10Code: "J00" }],
                ConsultationTicketHPs: physician
                  ? [
                      {
                        HealthCareProvider: {
                          HPProfile: {
                            title: physician.title ?? "DR.",
                            suffix: physician.suffix ?? "",
                          },
                          User: {
                            firstName: physician.firstName ?? "",
                            lastName: physician.lastName ?? "",
                          },
                        },
                      },
                    ]
                  : [],
                Prescriptions: [
                  {
                    isActive: true,
                    Medicines: medicines.map((m) => ({
                      id: m.id ?? 1,
                      name: m.name ?? "Medicine",
                      genericName: m.genericName ?? "Generic",
                      brandName: m.brandName ?? "Brand",
                      dosage: m.dosage ?? "500mg",
                      frequency: m.frequency ?? "TID",
                      unit: m.unit ?? "tab",
                      qty: m.qty ?? 10,
                      PhilHealthData: m.philHealthData ?? null,
                      MedicineDispenseRecord: null,
                    })),
                  },
                ],
                ConsultationManagements: [],
                PhysicalExaminations: [],
              },
            ],
          },
        },
      ],
    };
  };

  const getGeneratedXml = () => {
    expect(mockPrisma.konsultaBatchReport.update).toHaveBeenCalled();
    const updateArgs = mockPrisma.konsultaBatchReport.update.mock.calls[0][0];
    return updateArgs.data.xmlPayload as string;
  };

  // =========================================================================
  // TIER 1: Feature Coverage (Isolation / Happy-Path)
  // =========================================================================
  describe("Tier 1: Feature Coverage", () => {
    it("Feature #516: populates pPrescribingPhysician with Doctor title and name in <MEDICINE> tag", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          physician: {
            title: "DR.",
            firstName: "ALICE",
            lastName: "SMITH",
            suffix: "MD",
          },
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      expect(xml).toContain("<MEDICINE");
      expect(xml).toMatch(/pPrescribingPhysician="DR\.\s+ALICE\s+SMITH/i);
    });

    it("Feature #516: defaults medicine route to 'ORAL' when route is missing or empty", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          medicines: [
            {
              id: 1,
              name: "Paracetamol 500mg",
              qty: 10,
              philHealthData: {
                drugCode: "DRUG-PARA",
                genericCode: "GEN-PARA",
                route: "", // empty route
              },
            },
          ],
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      expect(xml).toContain('pRoute="ORAL"');
    });

    it("Feature #516: defaults unit price to '15.00' and calculates total price as quantity * unit price", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          medicines: [
            {
              id: 1,
              name: "Paracetamol 500mg",
              qty: 20,
              philHealthData: {
                drugCode: "DRUG-PARA",
                genericCode: "GEN-PARA",
                actualUnitPrice: null,
                totalAmtPrice: null,
              },
            },
          ],
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      expect(xml).toContain('pActualUnitPrice="15.00"');
      expect(xml).toContain('pTotalAmtPrice="300.00"');
    });

    it("Feature #515: clears 7 PNF library codes and sets otherMedicine, ANTIBIOTICS, and ANTI-INFECTIVES for unlisted medicines", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          medicines: [
            {
              id: 2,
              name: "Custom Unlisted Antibiotic 250mg",
              genericName: "Custom Unlisted Antibiotic",
              qty: 14,
              philHealthData: {
                drugCode: "NOMED00000000000000000000000", // unlisted marker
                genericCode: "GEN-CUSTOM",
                saltCode: "SALT-CUSTOM",
                strengthCode: "STR-CUSTOM",
                formCode: "FORM-CUSTOM",
                unitCode: "UNIT-CUSTOM",
                packageCode: "PKG-CUSTOM",
                otherMedicine: "Custom Unlisted Antibiotic 250mg",
                othMedDrugGrouping: "ANTIBIOTICS",
                category: "ANTI-INFECTIVES",
              },
            },
          ],
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      // Should clear 7 PNF library codes
      expect(xml).toContain('pDrugCode=""');
      expect(xml).toContain('pGenericCode=""');
      expect(xml).toContain('pSaltCode=""');
      expect(xml).toContain('pStrengthCode=""');
      expect(xml).toContain('pFormCode=""');
      expect(xml).toContain('pUnitCode=""');
      expect(xml).toContain('pPackageCode=""');
      // Should set other medicine and drug grouping defaults
      expect(xml).toMatch(/pOtherMedicine="Custom Unlisted Antibiotic 250mg"/i);
      expect(xml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
      expect(xml).toContain('pCategory="ANTI-INFECTIVES"');
    });

    it("Feature #511: filters out consultation diagnostic results (SP...) in Tranche 1 XML, keeping only profiling (PP...)", async () => {
      mockPrisma.konsultaDiagnosticResult.findMany.mockResolvedValue([
        {
          id: 10,
          hciTransNo: "PP1003883120261100001", // Profiling diagnostic test
          resultType: "CBC",
          resultData: { cbcResult: "Normal" },
        },
        {
          id: 11,
          hciTransNo: "SP1003883120261100001", // Consultation diagnostic test
          resultType: "URINALYSIS",
          resultData: { urinalysisResult: "Clear" },
        },
      ]);

      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          tagging: "1", // Tranche 1
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      // Must retain profiling test
      expect(xml).toContain("PP1003883120261100001");
      // Must NOT contain consultation test in Tranche 1
      expect(xml).not.toContain("SP1003883120261100001");
    });

    it("Feature #510: enforces 1 decimal place on pTemp and 2 decimal places on pBMI without precision leakage", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          vitals: {
            temp: 37.2, // Offset +0.2 -> 37.4 exactly
            height: 170,
            weight: 70, // Offset +0.5 -> 70.5
            bmi: 24.221456,
          },
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      // Must have exactly 1 decimal place for adjusted temp: 37.4
      expect(xml).toMatch(/pTemp="37\.4"/);
      expect(xml).not.toContain("37.400000000000006");
      // Must have 2 decimal places for BMI
      expect(xml).toMatch(/pBMI="\d+\.\d{2}"/);
    });
  });

  // =========================================================================
  // TIER 2: Boundary & Corner Cases
  // =========================================================================
  describe("Tier 2: Boundary & Corner Cases", () => {
    it("Boundary #510: handles floating point precision boundary 36.9 + 0.2 = 37.1 cleanly", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          vitals: {
            temp: 36.9,
            height: 165,
            weight: 65,
          },
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      expect(xml).toMatch(/pTemp="37\.1"/);
      expect(xml).not.toContain("37.100000000000005");
    });

    it("Boundary #516: preserves explicit route when specified (e.g. INTRAVENOUS)", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          medicines: [
            {
              id: 1,
              name: "Ceftriaxone 1g",
              qty: 1,
              philHealthData: {
                drugCode: "DRUG-CEFT",
                genericCode: "GEN-CEFT",
                route: "INTRAVENOUS",
              },
            },
          ],
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      expect(xml).toContain('pRoute="INTRAVENOUS"');
    });

    it("Boundary #516: calculates totalAmtPrice accurately with custom decimal unit price", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          medicines: [
            {
              id: 1,
              name: "Expensive Medicine",
              qty: 7,
              philHealthData: {
                drugCode: "DRUG-EXP",
                genericCode: "GEN-EXP",
                actualUnitPrice: "22.50",
                totalAmtPrice: "157.50",
              },
            },
          ],
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      expect(xml).toContain('pActualUnitPrice="22.50"');
      expect(xml).toContain('pTotalAmtPrice="157.50"');
    });

    it("Boundary #516: falls back to session doctor when consultation ticket health care provider is missing", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          physician: null, // No health professional attached to ticket
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      // Should fall back to session user "DR. SESSION DOCTOR"
      expect(xml).toMatch(/pPrescribingPhysician="DR\.\s+SESSION\s+DOCTOR"/i);
    });
  });

  // =========================================================================
  // TIER 3: Cross-Feature Combinations
  // =========================================================================
  describe("Tier 3: Cross-Feature Combinations", () => {
    it("Cross-Feature: combines listed and unlisted medicines in a single consultation", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          medicines: [
            {
              id: 1,
              name: "Amoxicillin 500mg",
              qty: 21,
              philHealthData: {
                drugCode: "DRUG-AMOX",
                genericCode: "GEN-AMOX",
                saltCode: "SALT-01",
                strengthCode: "STR-500",
                formCode: "FORM-CAP",
                unitCode: "UNIT-MG",
                packageCode: "PKG-BOX",
                category: "ANTI-INFECTIVES",
                route: "ORAL",
                actualUnitPrice: "15.00",
                totalAmtPrice: "315.00",
              },
            },
            {
              id: 2,
              name: "Unlisted Herbal Extract 100mg",
              genericName: "Herbal Extract",
              qty: 10,
              philHealthData: {
                drugCode: "NOMED00000000000000000000000",
                genericCode: "",
                saltCode: "",
                strengthCode: "",
                formCode: "",
                unitCode: "",
                packageCode: "",
                otherMedicine: "Unlisted Herbal Extract 100mg",
                othMedDrugGrouping: "ANTIBIOTICS",
                category: "ANTI-INFECTIVES",
                route: "", // should default to ORAL
                actualUnitPrice: "", // should default to 15.00
                totalAmtPrice: "", // should calculate 150.00
              },
            },
          ],
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      // Listed medicine retains codes
      expect(xml).toContain('pDrugCode="DRUG-AMOX"');
      expect(xml).toContain('pGenericCode="GEN-AMOX"');

      // Unlisted medicine clears codes and sets grouping
      expect(xml).toMatch(/pOtherMedicine="Unlisted Herbal Extract 100mg"/i);
      expect(xml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
      expect(xml).toContain('pCategory="ANTI-INFECTIVES"');

      // Both should have route and physician
      expect(xml).toMatch(/pPrescribingPhysician="DR\.\s+ALICE\s+SMITH/i);
    });

    it("Cross-Feature: Tranche 1 batch filters diagnostics while preserving profiling vitals precision", async () => {
      mockPrisma.konsultaDiagnosticResult.findMany.mockResolvedValue([
        {
          id: 10,
          hciTransNo: "PP1003883120261100001",
          resultType: "CBC",
          resultData: { cbcResult: "Normal" },
        },
        {
          id: 11,
          hciTransNo: "SP1003883120261100001",
          resultType: "FBS",
          resultData: { fbsResult: "95 mg/dL" },
        },
      ]);

      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          tagging: "1",
          vitals: {
            temp: 37.2,
            height: 170,
            weight: 70,
            bmi: 24.22,
          },
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      // Tranche 1 diagnostic filtering
      expect(xml).toContain("PP1003883120261100001");
      expect(xml).not.toContain("SP1003883120261100001");
      // Vitals rounding applied
      expect(xml).toMatch(/pTemp="37\.\d"/);
      expect(xml).not.toContain("37.400000000000006");
    });
  });

  // =========================================================================
  // TIER 4: Real-World Workflow Scenarios
  // =========================================================================
  describe("Tier 4: Real-World Workflow Scenarios", () => {
    it("Scenario: Full consultation XML export with vitals, unlisted antibiotic, prescribing doctor, and diagnostics", async () => {
      mockPrisma.konsultaDiagnosticResult.findMany.mockResolvedValue([
        {
          id: 10,
          hciTransNo: "PP1003883120261100001",
          resultType: "CHESTXRAY",
          resultData: { findings: "Clear lung fields" },
        },
        {
          id: 11,
          hciTransNo: "SP1003883120261100001",
          resultType: "ECG",
          resultData: { rhythm: "Normal Sinus Rhythm" },
        },
      ]);

      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createMockBatch({
          tagging: "2",
          physician: {
            title: "DR.",
            firstName: "GABRIEL",
            lastName: "REYES",
            suffix: "FPCP",
          },
          vitals: {
            temp: 37.2,
            height: 168,
            weight: 68,
            bmi: 24.09,
          },
          medicines: [
            {
              id: 10,
              name: "Co-Amoxiclav 625mg",
              genericName: "Co-Amoxiclav",
              qty: 14,
              philHealthData: {
                drugCode: "NOMED00000000000000000000000",
                otherMedicine: "Co-Amoxiclav 625mg",
                othMedDrugGrouping: "ANTIBIOTICS",
                category: "ANTI-INFECTIVES",
                route: "ORAL",
                actualUnitPrice: "15.00",
                totalAmtPrice: "210.00",
              },
            },
          ],
        })
      );

      const result = await generateBatchXmlAction("clinic-test-123", "batch-test-1");
      expect(result.status).toBe(true);

      const xml = getGeneratedXml();
      // XML wrapper tags
      expect(xml).toContain("<PCB");
      expect(xml).toContain("<SOAP");
      expect(xml).toContain("<MEDICINE");

      // Prescribing doctor
      expect(xml).toMatch(/pPrescribingPhysician="DR\.\s+GABRIEL\s+REYES/i);

      // Route and pricing
      expect(xml).toContain('pRoute="ORAL"');
      expect(xml).toContain('pActualUnitPrice="15.00"');
      expect(xml).toContain('pTotalAmtPrice="210.00"');

      // Unlisted groupings
      expect(xml).toMatch(/pOtherMedicine="Co-Amoxiclav 625mg"/i);
      expect(xml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
      expect(xml).toContain('pCategory="ANTI-INFECTIVES"');

      // Rounded vitals without precision leakage
      expect(xml).toMatch(/pTemp="37\.4"/);
      expect(xml).not.toContain("37.400000000000006");
    });
  });
});
