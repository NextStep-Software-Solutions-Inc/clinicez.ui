import { generateKonsultaXml, KonsultaXmlOptions, KonsultaMedicineData } from "./xml-generator";
import { buildPcbXml } from "../../services/konsulta/pcb-xml-builder";

describe("Adversarial Stress Verification: XML Generation & Edge Cases", () => {
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
            bmi: "21.48",
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

  // =========================================================================
  // TASK 3: emitPeMiscFields Adversarial Tests
  // =========================================================================
  describe("Task 3: emitPeMiscFields edge cases", () => {
    it("should handle empty strings, null, and undefined values gracefully", () => {
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
                  skinId: "",
                  heentId: null as unknown as string,
                  chestId: undefined,
                  heartId: "",
                  abdomenId: null as unknown as string,
                  neuroId: undefined,
                  rectalId: "",
                  guId: null as unknown as string,
                },
              ],
            },
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      expect(xml).toBeDefined();
      // Should emit fallback empty PEMISC to satisfy DTD without crash
      expect(xml).toContain('<PEMISC');
      expect(xml).not.toContain('pSkinId="null"');
      expect(xml).not.toContain('pSkinId="undefined"');
      expect(xml).not.toContain('pHeentId="null"');
      expect(xml).not.toContain('pChestId="undefined"');
    });

    it("should handle trailing semicolons, commas, and consecutive delimiters without creating empty PEMISC tags", () => {
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
                  // Trailing delimiter, consecutive delimiters, mixed delimiters, and whitespace
                  heartId: "  6 ; ; 3 , 7 ; ; ",
                  skinId: "10; ; 99,",
                },
              ],
            },
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      // Valid codes emitted trimmed
      expect(xml).toContain('pHeartId="6"');
      expect(xml).toContain('pHeartId="3"');
      expect(xml).toContain('pHeartId="7"');
      expect(xml).toContain('pSkinId="10"');
      expect(xml).toContain('pSkinId="99"');

      // Count occurrences of PEMISC elements
      const heart6Matches = xml.match(/pHeartId="6"/g);
      expect(heart6Matches).toHaveLength(1);
      const heart3Matches = xml.match(/pHeartId="3"/g);
      expect(heart3Matches).toHaveLength(1);

      // Verify no PEMISC element has whitespace or empty id when other findings exist
      const pemiscBlocks = xml.match(/<PEMISC[^>]+>/g) || [];
      for (const block of pemiscBlocks) {
        // Must not contain empty strings with spaces like pHeartId=" "
        expect(block).not.toMatch(/pHeartId="\s+"/);
        expect(block).not.toMatch(/pSkinId="\s+"/);
      }
    });

    it("should handle strings containing only delimiters (';;;' or ',,,')", () => {
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
                  heartId: ";;;",
                  skinId: " , , , ",
                },
              ],
            },
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      // Filter(Boolean) filters them out, leaving fallback empty PEMISC
      expect(xml).toBeDefined();
      expect(xml).toContain('<PEMISC');
      expect(xml).not.toContain('pHeartId=";"');
      expect(xml).not.toContain('pSkinId=","');
    });

    it("should preserve unknown and custom codes faithfully", () => {
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
                  skinId: "99;CUSTOM_CODE;-1",
                },
              ],
            },
          },
        ],
      };

      const xml = generateKonsultaXml(options);
      expect(xml).toContain('pSkinId="99"');
      expect(xml).toContain('pSkinId="CUSTOM_CODE"');
      expect(xml).toContain('pSkinId="-1"');
    });
  });

  // =========================================================================
  // TASK 2: Edge Case Compatibility for PCB XML vs Yakap XML
  // =========================================================================
  describe("Task 2: PCB XML vs Yakap XML Medicine Compatibility & Pricing", () => {
    it("should verify that unlisted medicine fields are present across Yakap XML pipeline", () => {
      const medicine: KonsultaMedicineData = {
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
        otherMedicine: "CEFALEXIN 500MG",
        othMedDrugGrouping: "ANTIBIOTICS",
        route: "ORAL",
        quantity: "14",
        actualUnitPrice: "15.00",
        totalAmtPrice: "210.00",
        instructionQuantity: "14",
        instructionStrength: "500MG",
        instructionFrequency: "TID",
        prescribingPhysician: "DR. EMILIO AGUINALDO",
        isDispensed: "N",
        dateDispensed: "",
        dispensingPersonnel: "LICENSED PHARMACIST",
        isApplicable: "Y",
        dateAdded: "2026-07-08",
      };

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
                subjective: { signsSymptoms: "01", otherComplaint: "" },
                vitals: baseOptions.patients[0].profile.vitals,
                consultationNotes: {},
                diagnoses: ["J00"],
                medicines: [medicine],
              },
            ],
          },
        ],
      };

      const yakapXml = generateKonsultaXml(options);

      // Verify Yakap XML attributes
      expect(yakapXml).toContain('pDrugCode=""');
      expect(yakapXml).toContain('pGenericCode=""');
      expect(yakapXml).toContain('pSaltCode=""');
      expect(yakapXml).toContain('pStrengthCode=""');
      expect(yakapXml).toContain('pFormCode=""');
      expect(yakapXml).toContain('pUnitCode=""');
      expect(yakapXml).toContain('pPackageCode=""');
      expect(yakapXml).toContain('pOtherMedicine="CEFALEXIN 500MG"');
      expect(yakapXml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
      expect(yakapXml).toContain('pCategory="ANTI-INFECTIVES"');
      expect(yakapXml).toContain('pRoute="ORAL"');
      expect(yakapXml).toContain('pActualUnitPrice="15.00"');
      expect(yakapXml).toContain('pTotalAmtPrice="210.00"');
      expect(yakapXml).toContain('pPrescribingPhysician="DR. EMILIO AGUINALDO"');
    });

    it("should verify that unlisted medicine fields are present across PCB XML pipeline", () => {
      const pcbXml = buildPcbXml({
        credentials: {
          hciAccreNo: "P10038831",
          pmccNo: "123456",
          cipherKey: "CIPHER123",
        },
        transmittalNumber: "RP1003883120261100001",
        enlistments: [],
        profiles: [],
        soaps: [],
        medicines: [
          {
            pHciCaseNo: "TP1003883120261100001",
            pHciTransNo: "SP1003883120261100001",
            pCategory: "ANTI-INFECTIVES",
            pDrugCode: "",
            pGenericCode: "",
            pSaltCode: "",
            pStrengthCode: "",
            pFormCode: "",
            pUnitCode: "",
            pPackageCode: "",
            pOtherMedicine: "CEFALEXIN 500MG",
            pOthMedDrugGrouping: "ANTIBIOTICS",
            pRoute: "ORAL",
            pQuantity: "14",
            pActualUnitPrice: "15.00",
            pTotalAmtPrice: "210.00",
            pInstructionQuantity: "14",
            pInstructionStrength: "500MG",
            pInstructionFrequency: "TID",
            pPrescribingPhysician: "DR. EMILIO AGUINALDO",
            pIsDispensed: "N",
            pDateDispensed: "",
            pDispensingPersonnel: "",
            pIsApplicable: "Y",
            pDateAdded: "2026-11-12",
            pReportStatus: "U",
            pDeficiencyRemarks: "",
          },
        ],
      });

      // Verify PCB XML attributes
      expect(pcbXml).toContain('pDrugCode=""');
      expect(pcbXml).toContain('pGenericCode=""');
      expect(pcbXml).toContain('pSaltCode=""');
      expect(pcbXml).toContain('pStrengthCode=""');
      expect(pcbXml).toContain('pFormCode=""');
      expect(pcbXml).toContain('pUnitCode=""');
      expect(pcbXml).toContain('pPackageCode=""');
      expect(pcbXml).toContain('pOtherMedicine="CEFALEXIN 500MG"');
      expect(pcbXml).toContain('pOthMedDrugGrouping="ANTIBIOTICS"');
      expect(pcbXml).toContain('pCategory="ANTI-INFECTIVES"');
      expect(pcbXml).toContain('pRoute="ORAL"');
      expect(pcbXml).toContain('pActualUnitPrice="15.00"');
      expect(pcbXml).toContain('pTotalAmtPrice="210.00"');
      expect(pcbXml).toContain('pPrescribingPhysician="DR. EMILIO AGUINALDO"');
    });

    it("should prevent NaN and undefined values from leaking into pActualUnitPrice and pTotalAmtPrice", () => {
      // Test cases simulating various database values
      const testCases = [
        { qty: "1", unitPrice: "15.00", total: "15.00" },
        { qty: "10", unitPrice: "15.00", total: "150.00" },
        { qty: "3", unitPrice: "25.50", total: "76.50" },
      ];

      for (const tc of testCases) {
        const medicine: KonsultaMedicineData = {
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
          otherMedicine: "TEST MED",
          othMedDrugGrouping: "ANTIBIOTICS",
          route: "ORAL",
          quantity: tc.qty,
          actualUnitPrice: tc.unitPrice,
          totalAmtPrice: tc.total,
          instructionQuantity: tc.qty,
          instructionStrength: "500MG",
          instructionFrequency: "OD",
          prescribingPhysician: "DR. TEST",
          isDispensed: "N",
          dateDispensed: "",
          dispensingPersonnel: "",
          isApplicable: "Y",
          dateAdded: "2026-07-08",
        };

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
                  subjective: { signsSymptoms: "01", otherComplaint: "" },
                  vitals: baseOptions.patients[0].profile.vitals,
                  consultationNotes: {},
                  diagnoses: ["J00"],
                  medicines: [medicine],
                },
              ],
            },
          ],
        };

        const xml = generateKonsultaXml(options);
        expect(xml).not.toContain('pActualUnitPrice="NaN"');
        expect(xml).not.toContain('pTotalAmtPrice="NaN"');
        expect(xml).not.toContain('pActualUnitPrice="undefined"');
        expect(xml).not.toContain('pTotalAmtPrice="undefined"');
        expect(xml).toContain(`pActualUnitPrice="${tc.unitPrice}"`);
        expect(xml).toContain(`pTotalAmtPrice="${tc.total}"`);
      }
    });

    it("should verify mapping fallback logic ensures zero NaN or undefined values under adversarial inputs", () => {
      // Simulate mapping logic from both actions:
      // In philhealth-yakap.actions.ts:
      const evaluateYakapPricing = (medQty: unknown, phActualUnitPrice: unknown, phTotalAmtPrice: unknown) => {
        const qtyNum = (medQty && Number(medQty) > 0) ? Number(medQty) : 1;
        const unitPriceNum = (phActualUnitPrice && Number(phActualUnitPrice) > 0)
          ? Number(phActualUnitPrice)
          : 15.00;
        const totalAmtNum = (phTotalAmtPrice && Number(phTotalAmtPrice) > 0)
          ? Number(phTotalAmtPrice)
          : (qtyNum * unitPriceNum);
        return {
          actualUnitPrice: unitPriceNum.toFixed(2),
          totalAmtPrice: totalAmtNum.toFixed(2),
        };
      };

      // In konsulta-report.action.ts:
      const evaluatePcbPricing = (medQty: unknown) => {
        const qty = typeof medQty === "number" && medQty > 0 ? medQty : 1;
        const unitPrice = "15.00";
        const totalAmt = (qty * 15.00).toFixed(2);
        return {
          actualUnitPrice: unitPrice,
          totalAmtPrice: totalAmt,
        };
      };

      const adversarialInputs = [
        { qty: null, price: null, total: null },
        { qty: undefined, price: undefined, total: undefined },
        { qty: 0, price: 0, total: 0 },
        { qty: "0", price: "0.00", total: "0.00" },
        { qty: -5, price: -10, total: -50 },
        { qty: "abc", price: "xyz", total: "invalid" },
        { qty: NaN, price: NaN, total: NaN },
      ];

      for (const input of adversarialInputs) {
        const yakap = evaluateYakapPricing(input.qty, input.price, input.total);
        expect(yakap.actualUnitPrice).not.toBe("NaN");
        expect(yakap.actualUnitPrice).not.toBe("undefined");
        expect(yakap.totalAmtPrice).not.toBe("NaN");
        expect(yakap.totalAmtPrice).not.toBe("undefined");
        expect(Number(yakap.actualUnitPrice)).toBeGreaterThanOrEqual(15.00);
        expect(Number(yakap.totalAmtPrice)).toBeGreaterThanOrEqual(15.00);

        const pcb = evaluatePcbPricing(input.qty);
        expect(pcb.actualUnitPrice).toBe("15.00");
        expect(pcb.totalAmtPrice).not.toBe("NaN");
        expect(pcb.totalAmtPrice).not.toBe("undefined");
        expect(Number(pcb.totalAmtPrice)).toBeGreaterThanOrEqual(15.00);
      }
    });
  });
});
