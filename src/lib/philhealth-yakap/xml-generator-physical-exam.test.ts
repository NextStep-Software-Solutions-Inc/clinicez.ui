import { generateKonsultaXml, KonsultaXmlOptions } from "./xml-generator";

describe("xml-generator physical exam multi-select findings", () => {
  const baseOptions: KonsultaXmlOptions = {
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
          physicalExaminations: [
            {
              generalSurveyId: "1",
              generalSurveyRemarks: "",
              // Case 3 multi-select findings
              skinId: "7;10;99",
              skinRemarks: "Dry and pale",
              heentId: "16;17",
              heentRemarks: "Pale conjunctivae & sunken eyeballs",
              chestId: "6", // Essentially normal
              chestRemarks: "",
              heartId: "6;3;7;8;4;9;99",
              heartRemarks: "Irregular heart sounds and murmurs",
              abdomenId: "8;9",
              abdomenRemarks: "",
              neuroId: "6",
              neuroRemarks: "",
              rectalId: "99",
              rectalRemarks: "Fissure present",
              guId: "3",
              guRemarks: "",
            },
          ],
        },
      },
    ],
  };

  it("should generate repeating PEMISC elements for multi-selected body system findings", () => {
    const xml = generateKonsultaXml(baseOptions);

    expect(xml).toBeDefined();

    // Verify PEMISC elements for Heart (codes 6, 3, 7, 8, 4, 9, 99)
    expect(xml).toContain('pHeartId="6"');
    expect(xml).toContain('pHeartId="3"');
    expect(xml).toContain('pHeartId="7"');
    expect(xml).toContain('pHeartId="8"');
    expect(xml).toContain('pHeartId="4"');
    expect(xml).toContain('pHeartId="9"');
    expect(xml).toContain('pHeartId="99"');

    // Verify PEMISC elements for Skin (codes 7, 10, 99)
    expect(xml).toContain('pSkinId="7"');
    expect(xml).toContain('pSkinId="10"');
    expect(xml).toContain('pSkinId="99"');

    // Verify PEMISC elements for HEENT (codes 16, 17)
    expect(xml).toContain('pHeentId="16"');
    expect(xml).toContain('pHeentId="17"');

    // Verify Abdomen (codes 8, 9)
    expect(xml).toContain('pAbdomenId="8"');
    expect(xml).toContain('pAbdomenId="9"');

    // Verify PESPECIFIC contains remarks for Others (uppercased per PhilHealth spec)
    expect(xml).toContain('pSkinRem="DRY AND PALE"');
    expect(xml).toContain('pHeartRem="IRREGULAR HEART SOUNDS AND MURMURS"');
    expect(xml).toContain('pRectalRem="FISSURE PRESENT"');
  });

  it("should normalize legacy codes for heart (2 -> 5) and neuro (3 -> 6)", () => {
    const options: KonsultaXmlOptions = {
      ...baseOptions,
      patients: [
        {
          ...baseOptions.patients[0],
          profile: {
            ...baseOptions.patients[0].profile,
            physicalExaminations: [
              {
                generalSurveyId: "1",
                heartId: "2",
                neuroId: "3",
              },
            ],
          },
        },
      ],
    };

    const xml = generateKonsultaXml(options);
    expect(xml).toContain('pHeartId="5"');
    expect(xml).toContain('pNeuroId="6"');
  });

  it("should correctly serialize unlisted medicines with pDrugCode empty string and grouping", () => {
    const tagging2Options: KonsultaXmlOptions = {
      ...baseOptions,
      tagging: "2",
      patients: [
        {
          ...baseOptions.patients[0],
          consultations: [
            {
              hciCaseNo: "TH9000000120260000001",
              hciTransNo: "SH9000000120260000001",
              soapDate: "2026-07-08",
              atc: "WALKEDIN",
              isWalkedIn: "Y",
              coPay: "0",
              subjective: { signsSymptoms: "01", otherComplaint: "" },
              vitals: baseOptions.patients[0].profile.vitals,
              consultationNotes: {},
              diagnoses: ["J06.9"],
              medicines: [
                {
                  hciCaseNo: "TH9000000120260000001",
                  hciTransNo: "SH9000000120260000001",
                  category: "ANTI-INFECTIVES",
                  drugCode: "",
                  genericCode: "",
                  saltCode: "",
                  strengthCode: "",
                  formCode: "",
                  unitCode: "",
                  packageCode: "",
                  otherMedicine: "AMOXICILLIN 500MG CAPSULE",
                  othMedDrugGrouping: "ANTIBIOTICS",
                  route: "ORAL",
                  quantity: "21",
                  actualUnitPrice: "15.00",
                  totalAmtPrice: "315.00",
                  instructionQuantity: "21",
                  instructionStrength: "500MG",
                  instructionFrequency: "TID",
                  prescribingPhysician: "DR. JUAN DELA CRUZ",
                  isDispensed: "N",
                  dateDispensed: "",
                  dispensingPersonnel: "",
                  isApplicable: "Y",
                  dateAdded: "2026-07-08",
                },
              ],
            },
          ],
        },
      ],
    };

    const xml = generateKonsultaXml(tagging2Options);
    expect(xml).toContain('pDrugCode=""');
    expect(xml).toContain('pOtherMedicine="AMOXICILLIN 500MG CAPSULE"');
    expect(xml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
    expect(xml).toContain('pCategory="ANTI-INFECTIVES"');
    expect(xml).toContain('pRoute="ORAL"');
    expect(xml).toContain('pPrescribingPhysician="DR. JUAN DELA CRUZ"');
    expect(xml).toContain('pActualUnitPrice="15.00"');
    expect(xml).toContain('pTotalAmtPrice="315.00"');
  });

  it("should keep DEFAULT_DRUG_CODE when medicine is listed without drugCode and not otherMedicine", () => {
    const tagging2Options: KonsultaXmlOptions = {
      ...baseOptions,
      tagging: "2",
      patients: [
        {
          ...baseOptions.patients[0],
          consultations: [
            {
              hciCaseNo: "TH9000000120260000001",
              hciTransNo: "SH9000000120260000001",
              soapDate: "2026-07-08",
              atc: "WALKEDIN",
              isWalkedIn: "Y",
              coPay: "0",
              subjective: { signsSymptoms: "01", otherComplaint: "" },
              vitals: baseOptions.patients[0].profile.vitals,
              consultationNotes: {},
              diagnoses: ["J06.9"],
              medicines: [
                {
                  hciCaseNo: "TH9000000120260000001",
                  hciTransNo: "SH9000000120260000001",
                  category: "ANTI-INFECTIVES",
                  drugCode: "DRUG123",
                  genericCode: "GEN456",
                  saltCode: "",
                  strengthCode: "",
                  formCode: "",
                  unitCode: "",
                  packageCode: "",
                  otherMedicine: "",
                  route: "ORAL",
                  quantity: "10",
                  actualUnitPrice: "15.00",
                  totalAmtPrice: "150.00",
                  instructionQuantity: "10",
                  instructionStrength: "500MG",
                  instructionFrequency: "BID",
                  prescribingPhysician: "DR. JUAN DELA CRUZ",
                  isDispensed: "N",
                  dateDispensed: "",
                  dispensingPersonnel: "",
                  isApplicable: "Y",
                  dateAdded: "2026-07-08",
                },
              ],
            },
          ],
        },
      ],
    };

    const xml = generateKonsultaXml(tagging2Options);
    expect(xml).toContain('pDrugCode="DRUG123"');
  });

  describe("Issue #519: Diabetes Mellitus family history validation by tagging", () => {
    it.each([
      { code: "006", specificDesc: "DIABETES MELLITUS" },
      { code: "6", specificDesc: "Diabetes" },
      { code: "998", specificDesc: "DIABETES MELLITUS" },
    ])(
      "allows Tranche 1 (tagging: '1') XML generation with DM family history (%o) and no diagnosticResults, emitting stub <DIAGNOSTICEXAMRESULT>",
      (famHist) => {
        const options: KonsultaXmlOptions = {
          ...baseOptions,
          tagging: "1",
          patients: [
            {
              ...baseOptions.patients[0],
              profile: {
                ...baseOptions.patients[0].profile,
                familyHistories: [famHist],
              },
              diagnosticResults: undefined,
            },
          ],
        };

        const xml = generateKonsultaXml(options);
        expect(xml).toContain("<DIAGNOSTICEXAMRESULTS>");
        expect(xml).toContain('<DIAGNOSTICEXAMRESULT pHciCaseNo="" pHciTransNo="" pPatientPin="" pPatientType="" pMemPin="" pEffYear=""');
      }
    );

    it.each([
      { code: "006", specificDesc: "DIABETES MELLITUS" },
      { code: "6", specificDesc: "Diabetes" },
      { code: "998", specificDesc: "DIABETES MELLITUS" },
    ])(
      "throws PhilHealth Validation Error for Tranche 2 (tagging: '2') when DM family history (%o) is present and diagnosticResults are missing",
      (famHist) => {
        const options: KonsultaXmlOptions = {
          ...baseOptions,
          tagging: "2",
          patients: [
            {
              ...baseOptions.patients[0],
              profile: {
                ...baseOptions.patients[0].profile,
                familyHistories: [famHist],
              },
              diagnosticResults: [],
            },
          ],
        };

        expect(() => generateKonsultaXml(options)).toThrow(
          /PhilHealth Validation Error: A Diagnostic Exam Result is strictly required because the patient has a Family History of Diabetes Mellitus\./
        );
      }
    );

    it("allows Tranche 2 (tagging: '2') XML generation when DM family history AND diagnosticResults are provided", () => {
      const options: KonsultaXmlOptions = {
        ...baseOptions,
        tagging: "2",
        patients: [
          {
            ...baseOptions.patients[0],
            profile: {
              ...baseOptions.patients[0].profile,
              familyHistories: [{ code: "006", specificDesc: "DIABETES MELLITUS" }],
            },
            diagnosticResults: [
              {
                hciCaseNo: "TH9000000120260000001",
                hciTransNo: "SH9000000120260000001",
                patientPin: "030263078507",
                patientType: "MM",
                memPin: "030263078507",
                effYear: "2026",
                resultType: "FBS",
                resultData: { glucoseMg: "95" },
              },
            ],
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      expect(xml).toContain('<FAMHIST pMdiseaseCode="006"');
      expect(xml).toContain("<DIAGNOSTICEXAMRESULTS>");
      expect(xml).toContain("<FBS ");
      expect(xml).not.toContain('<DIAGNOSTICEXAMRESULT pHciCaseNo=""');
    });
  });

  describe("Issue #520: <SUBJECTIVE> code normalization, uppercase output, and Data Dictionary limits", () => {
    it("deduplicates signsSymptoms, zero-pads single digits, normalizes lowercase x->X, and enforces 2000/2000/500 caps", () => {
      const options: KonsultaXmlOptions = {
        ...baseOptions,
        tagging: "2",
        patients: [
          {
            ...baseOptions.patients[0],
            consultations: [
              {
                hciCaseNo: "TH9000000120260000001",
                hciTransNo: "SH9000000120260000001",
                soapDate: "2026-07-08",
                atc: "WALKEDIN",
                isWalkedIn: "Y",
                coPay: "0",
                subjective: {
                  illnessHistory: `persistent fever ${"a".repeat(2100)}`,
                  signsSymptoms: "2; 38; x; 02; X; 9",
                  painSite: `epigastric region ${"b".repeat(550)}`,
                  otherComplaint: `loss of appetite ${"c".repeat(2100)}`,
                },
                vitals: baseOptions.patients[0].profile.vitals,
                diagnoses: ["J00"],
              },
            ],
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      const subjMatch = xml.match(/<SUBJECTIVE\s+([^>]+)\/>/);
      expect(subjMatch).not.toBeNull();
      const attrs = subjMatch![1];

      const hpiVal = attrs.match(/pIllnessHistory="([^"]*)"/)?.[1] ?? "";
      const signsVal = attrs.match(/pSignsSymptoms="([^"]*)"/)?.[1] ?? "";
      const otherVal = attrs.match(/pOtherComplaint="([^"]*)"/)?.[1] ?? "";
      const painVal = attrs.match(/pPainSite="([^"]*)"/)?.[1] ?? "";

      expect(signsVal).toBe("02;38;X;09");
      expect(hpiVal).toHaveLength(2000);
      expect(hpiVal.startsWith("PERSISTENT FEVER ")).toBe(true);
      expect(otherVal).toHaveLength(2000);
      expect(otherVal.startsWith("LOSS OF APPETITE ")).toBe(true);
      expect(painVal).toHaveLength(500);
      expect(painVal.startsWith("EPIGASTRIC REGION ")).toBe(true);
    });

    it("handles legacy non-code free text in signsSymptoms by routing to X and uppercasing pOtherComplaint", () => {
      const options: KonsultaXmlOptions = {
        ...baseOptions,
        tagging: "2",
        patients: [
          {
            ...baseOptions.patients[0],
            consultations: [
              {
                hciCaseNo: "TH9000000120260000001",
                hciTransNo: "SH9000000120260000001",
                soapDate: "2026-07-08",
                atc: "WALKEDIN",
                isWalkedIn: "Y",
                coPay: "0",
                subjective: {
                  illnessHistory: "Onset 2 days ago",
                  signsSymptoms: "Persistent dizziness",
                  otherComplaint: "Mild fatigue",
                },
                vitals: baseOptions.patients[0].profile.vitals,
                diagnoses: ["R42"],
              },
            ],
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      expect(xml).toContain('pSignsSymptoms="X"');
      expect(xml).toContain('pOtherComplaint="PERSISTENT DIZZINESS | MILD FATIGUE"');
      expect(xml).toContain('pIllnessHistory="ONSET 2 DAYS AGO"');
    });

    it("does not re-inject 38 or X from stale painSite or otherComplaint in generateKonsultaXml", () => {
      const options: KonsultaXmlOptions = {
        ...baseOptions,
        tagging: "2",
        patients: [
          {
            ...baseOptions.patients[0],
            consultations: [
              {
                hciCaseNo: "TH9000000120260000002",
                hciTransNo: "SH9000000120260000002",
                soapDate: "2026-07-08",
                atc: "WALKEDIN",
                isWalkedIn: "Y",
                coPay: "0",
                subjective: {
                  illnessHistory: "dry cough",
                  signsSymptoms: "09",
                  painSite: "STALE CHEST PAIN",
                  otherComplaint: "STALE OTHER COMPLAINT",
                },
                vitals: baseOptions.patients[0].profile.vitals,
                diagnoses: ["J00"],
              },
            ],
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      expect(xml).toContain('pSignsSymptoms="09"');
      expect(xml).not.toContain("38");
      expect(xml).toContain('pPainSite=""');
      expect(xml).toContain('pOtherComplaint=""');
      expect(xml).toContain('pIllnessHistory="DRY COUGH"');
      expect(xml).not.toContain("STALE CHEST PAIN");
      expect(xml).not.toContain("STALE OTHER COMPLAINT");
    });
  });
});
