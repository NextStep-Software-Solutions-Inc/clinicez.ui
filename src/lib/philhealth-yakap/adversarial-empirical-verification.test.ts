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
jest.mock("@/actions/consultation/konsulta-recommended-services.action", () => ({
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
import { generateBatchXmlAction } from "@/actions/philhealth-yakap.actions";
import { generateKonsultaXml, KonsultaXmlOptions } from "./xml-generator";

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

describe("Milestone 1: Empirical Adversarial Challenge Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      PHILHEALTH_KONSULTA_CERT_ID: "CERT-ADV-12345",
      PHILHEALTH_KONSULTA_CIPHER_KEY: "CIPHERKEY12345678",
    };

    mockGetCachedSession.mockResolvedValue({
      user: {
        sub: "usr_session_1",
        name: "DR. DEFAULT DOCTOR",
        given_name: "DEFAULT",
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

  const baseXmlOptions: KonsultaXmlOptions = {
    credentials: {
      pUsername: "TEST_USER",
      pPassword: "TEST_PASSWORD",
      pHciAccreNo: "H90000001",
      pPMCCNo: "123456",
      pCertificationId: "CERT-1234567890123456",
      pHciTransmittalNumber: "RH9000000120260000001",
    },
    tagging: "1",
    patients: [
      {
        enlistment: {
          hciCaseNo: "TH9000000120260000001",
          hciTransNo: "EH9000000120260000001",
          effYear: "2026",
          enlistDate: "2026-07-08",
          packageType: "K",
          withConsent: "Y",
          transDate: "2026-07-08",
          createdBy: "ADMIN",
        },
        member: {
          pin: "030263078507",
          firstName: "MARIA",
          middleName: "SANTOS",
          lastName: "DELA CRUZ",
          extName: "",
          dob: "1990-05-15",
        },
        patient: {
          pin: "030263078507",
          firstName: "MARIA",
          middleName: "SANTOS",
          lastName: "DELA CRUZ",
          extName: "",
          sex: "F",
          dob: "1990-05-15",
          type: "MM",
          age: "36",
          mobileNo: "09171234567",
          landlineNo: "",
        },
        profile: {
          hciTransNo: "PH9000000120260000001",
          profDate: "2026-07-08",
          atc: "WALKEDIN",
          isWalkedIn: "Y",
          transDate: "2026-07-08",
          vitals: {
            systolic: "120",
            diastolic: "80",
            hr: "75",
            rr: "18",
            temp: "36.5",
            height: "160",
            weight: "55",
            bmi: "21.5",
            zScore: "",
            leftVision: "20/20",
            rightVision: "20/20",
            length: "",
            headCirc: "",
            skinfoldThickness: "",
            waist: "",
            hip: "",
            limbs: "",
            midUpperArmCirc: "",
          },
          bloodType: "O+",
          medicalHistories: [],
          familyHistories: [],
          surgicalHistories: [],
          immunizations: [],
          physicalExaminations: [],
        },
      },
    ],
  };

  type BatchBuilderOptions = {
    tagging?: "1" | "2";
    medicines?: Array<{
      id?: number;
      name?: string;
      genericName?: string;
      dosage?: string;
      frequency?: string;
      qty?: number;
      philHealthData?: Record<string, unknown> | null;
    }>;
    physician?: {
      title?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      suffix?: string | null;
    } | null;
    sessionUser?: {
      name?: string | null;
      given_name?: string | null;
      family_name?: string | null;
    } | null;
    vitals?: {
      temp?: number | null;
      height?: number | null;
      weight?: number | null;
      bmi?: number | null;
      bpSystolic?: number | null;
      bpDiastolic?: number | null;
      pulseRate?: number | null;
      respRate?: number | null;
      consultationTicketId?: number | null;
    };
    diagnosticResults?: Array<{
      id: number;
      consultationTicketId?: number | null;
      hciTransNo?: string | null;
      resultType: string;
      resultData?: Record<string, unknown>;
    }>;
  };

  const createBatch = (opts: BatchBuilderOptions = {}) => {
    const tagging = opts.tagging ?? "2";
    const medicines = opts.medicines ?? [
      {
        id: 1,
        name: "Test Med 500mg",
        qty: 10,
        philHealthData: {
          drugCode: "DRUG-001",
          genericCode: "GEN-001",
          route: "ORAL",
          actualUnitPrice: "15.00",
          totalAmtPrice: "150.00",
        },
      },
    ];

    const vitals = opts.vitals ?? {
      bpSystolic: 120,
      bpDiastolic: 80,
      pulseRate: 72,
      respRate: 18,
      temp: 36.8,
      height: 165,
      weight: 60,
      bmi: 22.04,
      consultationTicketId: null,
    };

    return {
      id: "batch-adv-1",
      clinicId: 1,
      tagging,
      status: "DRAFT",
      transmittalNo: "TP1003883120261100001",
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
                  consultationTicketId: vitals.consultationTicketId ?? null,
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
                ConsultationTicketHPs: opts.physician !== undefined && opts.physician !== null
                  ? [
                      {
                        HealthCareProvider: {
                          HPProfile: {
                            title: opts.physician.title ?? "DR.",
                            suffix: opts.physician.suffix ?? "",
                          },
                          User: {
                            firstName: opts.physician.firstName ?? "",
                            lastName: opts.physician.lastName ?? "",
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
                      dosage: m.dosage ?? "500mg",
                      frequency: m.frequency ?? "TID",
                      qty: m.qty,
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

  const getXml = () => {
    expect(mockPrisma.konsultaBatchReport.update).toHaveBeenCalled();
    const args = mockPrisma.konsultaBatchReport.update.mock.calls[0][0];
    return args.data.xmlPayload as string;
  };

  // =========================================================================
  // TASK 1: MEDICINE ROUTE, PRICING, AND ATTENDING PHYSICIAN
  // =========================================================================
  describe("Task 1: Medicine route, pricing, and attending physician", () => {
    it("1.1: Handles HP User with only firstName (no lastName)", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          physician: {
            title: "DR.",
            firstName: "GABRIEL",
            lastName: "",
          },
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain('pPrescribingPhysician="DR. GABRIEL"');
      expect(xml).not.toMatch(/DR\.\s+GABRIEL\s{2,}/);
    });

    it("1.2: Handles HP User with only lastName (no firstName)", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          physician: {
            title: "DR.",
            firstName: null,
            lastName: "DELA CRUZ",
          },
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain('pPrescribingPhysician="DR. DELA CRUZ"');
      expect(xml).not.toContain("DR.  DELA CRUZ");
    });

    it("1.3: Handles HP User with custom title (e.g., DRA.) without doubling DR prefix", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          physician: {
            title: "DRA.",
            firstName: "MARIA",
            lastName: "SANTOS",
          },
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain('pPrescribingPhysician="DRA. MARIA SANTOS"');
      expect(xml).not.toContain("DR. DRA.");
    });

    it("1.4: Security boundary: Unauthenticated session returns status: false 'Unauthorized'", async () => {
      mockGetCachedSession.mockResolvedValue(null); // No session

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(false);
      expect(res.message).toBe("Unauthorized");
    });

    it("1.5: Falls back cleanly to DR. ATTENDING PHYSICIAN when session user has no given/family names", async () => {
      mockGetCachedSession.mockResolvedValue({
        user: { sub: "usr_1", name: "", given_name: "", family_name: "" },
      });
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          physician: null,
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain('pPrescribingPhysician="DR. ATTENDING PHYSICIAN"');
    });

    it("1.6: Falls back to session user with only family_name", async () => {
      mockGetCachedSession.mockResolvedValue({
        user: { sub: "usr_1", given_name: "", family_name: "SANTOS" },
      });
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          physician: null,
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain('pPrescribingPhysician="DR. SANTOS"');
    });

    it("1.7: Medicine qty = undefined / null defaults unit price to 15.00, totalAmt to 15.00, and quantity to 1", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          medicines: [
            {
              id: 1,
              name: "Amox 500mg",
              qty: undefined,
              philHealthData: {
                drugCode: "DRUG-01",
                actualUnitPrice: null,
                totalAmtPrice: null,
              },
            },
          ],
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain('pActualUnitPrice="15.00"');
      expect(xml).toContain('pTotalAmtPrice="15.00"');
      expect(xml).toContain('pQuantity="1"');
    });

    it("1.8: Medicine qty = 0 defaults qtyNum to 1 for pricing calculation and outputs 15.00 unit price", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          medicines: [
            {
              id: 1,
              name: "Zero Qty Med",
              qty: 0,
              philHealthData: {
                drugCode: "DRUG-01",
                actualUnitPrice: null,
                totalAmtPrice: null,
              },
            },
          ],
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain('pActualUnitPrice="15.00"');
      expect(xml).toContain('pTotalAmtPrice="15.00"');
    });

    it("1.9: Route defaults to ORAL when route is missing or empty, and preserves custom route", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          medicines: [
            {
              id: 1,
              name: "Oral Med",
              qty: 10,
              philHealthData: { drugCode: "D1", route: "" },
            },
            {
              id: 2,
              name: "Topical Med",
              qty: 1,
              philHealthData: { drugCode: "D2", route: "TOPICAL" },
            },
          ],
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain('pRoute="ORAL"');
      expect(xml).toContain('pRoute="TOPICAL"');
    });
  });

  // =========================================================================
  // TASK 2: UNLISTED MEDICINES
  // =========================================================================
  describe("Task 2: Unlisted medicines", () => {
    it("2.1: Directly in xml-generator, when otherMedicine is set, pDrugCode is strictly empty string and NOT NOMED", () => {
      const options: KonsultaXmlOptions = {
        ...baseXmlOptions,
        tagging: "2",
        patients: [
          {
            ...baseXmlOptions.patients[0],
            consultations: [
              {
                hciCaseNo: "TH9000000120260000001",
                hciTransNo: "SH9000000120260000001",
                soapDate: "2026-07-08",
                atc: "WALKEDIN",
                isWalkedIn: "Y",
                coPay: "0",
                subjective: { signsSymptoms: "01" },
                vitals: baseXmlOptions.patients[0].profile.vitals,
                diagnoses: ["J00"],
                medicines: [
                  {
                    hciCaseNo: "TH9000000120260000001",
                    hciTransNo: "SH9000000120260000001",
                    category: "ANTI-INFECTIVES",
                    drugCode: "", // empty
                    otherMedicine: "UNLISTED COMPOUND X",
                    othMedDrugGrouping: "ANTIBIOTICS",
                    route: "ORAL",
                    quantity: "14",
                    actualUnitPrice: "15.00",
                    totalAmtPrice: "210.00",
                    instructionQuantity: "14",
                    instructionStrength: "500MG",
                    instructionFrequency: "BID",
                    prescribingPhysician: "DR. TESTING",
                    isDispensed: "N",
                    isApplicable: "Y",
                    dateAdded: "2026-07-08",
                  },
                ],
              },
            ],
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      expect(xml).toContain('pDrugCode=""');
      expect(xml).not.toMatch(/pDrugCode="NOMED/);
      expect(xml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
      expect(xml).toContain('pCategory="ANTI-INFECTIVES"');
    });

    it("2.2: Directly in xml-generator, when medicine has NO drugCode and NO otherMedicine, falls back to NOMED default", () => {
      const options: KonsultaXmlOptions = {
        ...baseXmlOptions,
        tagging: "2",
        patients: [
          {
            ...baseXmlOptions.patients[0],
            consultations: [
              {
                hciCaseNo: "TH9000000120260000001",
                hciTransNo: "SH9000000120260000001",
                soapDate: "2026-07-08",
                atc: "WALKEDIN",
                isWalkedIn: "Y",
                coPay: "0",
                subjective: { signsSymptoms: "01" },
                vitals: baseXmlOptions.patients[0].profile.vitals,
                diagnoses: ["J00"],
                medicines: [
                  {
                    hciCaseNo: "TH9000000120260000001",
                    hciTransNo: "SH9000000120260000001",
                    category: "ANTI-INFECTIVES",
                    drugCode: "",
                    otherMedicine: "", // NOT otherMedicine
                    route: "ORAL",
                    quantity: "10",
                    actualUnitPrice: "15.00",
                    totalAmtPrice: "150.00",
                    instructionQuantity: "10",
                    prescribingPhysician: "DR. TESTING",
                    isDispensed: "N",
                    isApplicable: "Y",
                    dateAdded: "2026-07-08",
                  },
                ],
              },
            ],
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      expect(xml).toContain('pDrugCode="NOMED00000000000000000000000"');
    });

    it("2.3: In server action, unlisted medicine clears all 7 PNF codes to empty string", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          medicines: [
            {
              id: 99,
              name: "Adversarial Unlisted Med 100mg",
              qty: 7,
              philHealthData: {
                drugCode: "NOMED123",
                genericCode: "GEN-CUSTOM",
                saltCode: "SALT-CUSTOM",
                strengthCode: "STR-CUSTOM",
                formCode: "FORM-CUSTOM",
                unitCode: "UNIT-CUSTOM",
                packageCode: "PKG-CUSTOM",
                otherMedicine: "Adversarial Unlisted Med 100mg",
                othMedDrugGrouping: "ANTIBIOTICS",
                category: "ANTI-INFECTIVES",
              },
            },
          ],
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain('pDrugCode=""');
      expect(xml).toContain('pGenericCode=""');
      expect(xml).toContain('pSaltCode=""');
      expect(xml).toContain('pStrengthCode=""');
      expect(xml).toContain('pFormCode=""');
      expect(xml).toContain('pUnitCode=""');
      expect(xml).toContain('pPackageCode=""');
      expect(xml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
      expect(xml).toContain('pCategory="ANTI-INFECTIVES"');
      expect(xml).not.toContain("NOMED123");
    });
  });

  // =========================================================================
  // TASK 3: TRANCHE 1 DIAGNOSTIC FILTERING
  // =========================================================================
  describe("Task 3: Tranche 1 diagnostic filtering", () => {
    it("3.1: Excludes consultation diagnostics (consultationTicketId set or SP... trans number) when tagging === '1'", async () => {
      mockPrisma.konsultaDiagnosticResult.findMany.mockResolvedValue([
        {
          id: 1,
          consultationTicketId: 101, // consultation ticket present -> EXCLUDE
          hciTransNo: "PP1003883120261100001",
          resultType: "CBC",
          resultData: { hematocrit: "40" },
        },
        {
          id: 2,
          consultationTicketId: null,
          hciTransNo: "SP1003883120261100001", // SP transaction prefix -> EXCLUDE
          resultType: "URINALYSIS",
          resultData: { gravity: "1.015" },
        },
        {
          id: 3,
          consultationTicketId: 101,
          hciTransNo: "SP1003883120261100001", // Both set -> EXCLUDE
          resultType: "CHESTXRAY",
          resultData: { findings: "Normal" },
        },
        {
          id: 4,
          consultationTicketId: null,
          hciTransNo: "PP1003883120261100001", // Legitimate profiling diagnostic -> INCLUDE
          resultType: "FBS",
          resultData: { glucoseMg: "95" },
        },
      ]);

      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          tagging: "1", // TRANCHE 1
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();

      // Profiling FBS diagnostic MUST be included in FBSS container
      expect(xml).toContain("<FBSS>");
      expect(xml).toContain("<FBS");
      expect(xml).toContain('pGlucoseMg="95"');

      // Consultation diagnostics MUST be completely excluded from Tranche 1 XML
      expect(xml).not.toContain("<CBCS>");
      expect(xml).not.toContain("<CBC");
      expect(xml).not.toContain("<URINALYSISS>");
      expect(xml).not.toContain("<URINALYSIS");
      expect(xml).not.toContain("<CHESTXRAYS>");
      expect(xml).not.toContain("<CHESTXRAY");
      expect(xml).not.toContain("SP1003883120261100001");
    });

    it("3.2: Tagging 2 includes consultation diagnostics", async () => {
      mockPrisma.konsultaDiagnosticResult.findMany.mockResolvedValue([
        {
          id: 2,
          consultationTicketId: 101,
          hciTransNo: "SP1003883120261100001",
          resultType: "URINALYSIS",
          resultData: { gravity: "1.015" },
        },
      ]);

      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          tagging: "2", // TRANCHE 2
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).toContain("<URINALYSISS>");
      expect(xml).toContain("<URINALYSIS");
      expect(xml).toContain('pGravity="1.015"');
      expect(xml).toContain("SP1003883120261100001");
    });
  });

  // =========================================================================
  // TASK 4: VITALS FLOAT ROUNDING
  // =========================================================================
  describe("Task 4: Vitals float rounding", () => {
    it("4.1: Strictly formats pTemp to 1 decimal place and pBMI to 2 decimal places with float inputs", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          tagging: "2",
          vitals: {
            // 37.2 + 0.2 = 37.400000000000006 in standard JS IEEE-754 arithmetic
            temp: 37.2,
            height: 168.3,
            weight: 68.7,
            // (68.7 + 0.5) / (1.683 * 1.683) = 69.2 / 2.832489 = 24.430809...
            bmi: 24.430809,
            consultationTicketId: 101, // dedicated consultation vital signs
          },
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();

      // No IEEE-754 float leakage
      expect(xml).not.toContain("37.400000000000006");
      expect(xml).not.toContain("24.430809");

      // Strictly 1 decimal place for temp: 37.2 + 0.2 -> 37.4
      expect(xml).toMatch(/pTemp="37\.4"/);

      // Strictly 2 decimal places for BMI: (68.7 + 0.5) / (1.683^2) -> 24.43
      expect(xml).toMatch(/pBMI="24\.43"/);

      // Strictly 1 decimal place for temp in XML attributes
      const tempMatches = xml.match(/pTemp="([^"]+)"/g);
      expect(tempMatches).toBeDefined();
      for (const match of tempMatches!) {
        const val = match.replace(/pTemp="([^"]+)"/, "$1");
        if (val) {
          expect(val).toMatch(/^\d+\.\d$/);
        }
      }

      // Strictly 2 decimal places for BMI in XML attributes
      const bmiMatches = xml.match(/pBMI="([^"]+)"/g);
      expect(bmiMatches).toBeDefined();
      for (const match of bmiMatches!) {
        const val = match.replace(/pBMI="([^"]+)"/, "$1");
        if (val) {
          expect(val).toMatch(/^\d+\.\d{2}$/);
        }
      }
    });

    it("4.2: Boundary float addition: 36.9 + 0.2 = 37.100000000000005 rounds cleanly to 37.1", async () => {
      mockPrisma.konsultaBatchReport.findUnique.mockResolvedValue(
        createBatch({
          tagging: "2",
          vitals: {
            temp: 36.9,
            height: 170,
            weight: 70,
            bmi: 24.22,
            consultationTicketId: 101, // consultation ticket vital
          },
        })
      );

      const res = await generateBatchXmlAction("clinic-test-123", "batch-adv-1");
      expect(res.status).toBe(true);

      const xml = getXml();
      expect(xml).not.toContain("37.100000000000005");
      expect(xml).toMatch(/pTemp="37\.1"/);
    });
  });

  // =========================================================================
  // TASK 5: MULTI-PEMISC XML TAGS
  // =========================================================================
  describe("Task 5: Multi-PEMISC XML tags", () => {
    it("5.1: Delimited string with extra whitespace, commas, and semicolons generates individual trimmed tags", () => {
      const options: KonsultaXmlOptions = {
        ...baseXmlOptions,
        patients: [
          {
            ...baseXmlOptions.patients[0],
            profile: {
              ...baseXmlOptions.patients[0].profile,
              physicalExaminations: [
                {
                  generalSurveyId: "1",
                  skinId: "  7  ;  ,  10  ;;;  99  ,  ",
                },
              ],
            },
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      expect(xml).toContain('pSkinId="7"');
      expect(xml).toContain('pSkinId="10"');
      expect(xml).toContain('pSkinId="99"');
      // Should NOT have PEMISC with whitespace or empty
      expect(xml).not.toMatch(/pSkinId="\s+"/);
    });

    it("5.2: Normalizes legacy heart code 2 to 5 and legacy neuro code 3 to 6 across delimited lists", () => {
      const options: KonsultaXmlOptions = {
        ...baseXmlOptions,
        patients: [
          {
            ...baseXmlOptions.patients[0],
            profile: {
              ...baseXmlOptions.patients[0].profile,
              physicalExaminations: [
                {
                  generalSurveyId: "1",
                  heartId: " 6 ; 2 ; 3 ", // 2 -> 5, 3 stays 3 (murmur)
                  neuroId: " 3 ; 6 ",     // 3 -> 6
                },
              ],
            },
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      // Heart: 6, 5 (normalized from 2), 3
      expect(xml).toContain('pHeartId="6"');
      expect(xml).toContain('pHeartId="5"');
      expect(xml).toContain('pHeartId="3"');
      expect(xml).not.toMatch(/pHeartId="2"/);

      // Neuro: 6 (normalized from 3), 6
      expect(xml).toContain('pNeuroId="6"');
      expect(xml).not.toMatch(/pNeuroId="3"/);
    });

    it("5.3: Empty physical examination findings emit a fallback blank PEMISC tag", () => {
      const options: KonsultaXmlOptions = {
        ...baseXmlOptions,
        patients: [
          {
            ...baseXmlOptions.patients[0],
            profile: {
              ...baseXmlOptions.patients[0].profile,
              physicalExaminations: [
                {
                  generalSurveyId: "1",
                  skinId: "",
                  heentId: null as unknown as string,
                  chestId: undefined,
                  heartId: "",
                  abdomenId: "",
                  neuroId: "",
                  rectalId: "",
                  guId: "",
                },
              ],
            },
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      expect(xml).toContain("<PEMISCS>");
      expect(xml).toContain('<PEMISC pSkinId="" pHeentId="" pChestId="" pHeartId="" pAbdomenId="" pNeuroId="" pRectalId="" pGuId=""');
    });
  });
});
