import { GetMedicationDrugs } from "@/actions/medications/medication-drug.action";


type preparePrescriptionPayload = {
    template: string;
    prescriptionDate: string;
    medications: GetMedicationDrugs["data"];
    patient: {
        name: string;
        age: string;
        gender: string;
        address: string;
    },
    hp: {
        name: string;
        specialization: string;
        licenseNumber: string;
        ptrNumber: string;
        signatureUrl: string;
    }
}
export const preparePrescription =  (payload:preparePrescriptionPayload):string => {

  const {template, medications, patient, hp, prescriptionDate = new Date().toLocaleDateString()} = payload;
  const {name, age, gender, address} = patient;
  const {specialization, licenseNumber, ptrNumber, signatureUrl, name: hpName} = hp;
  

  // create tbody rows for medications
  let medicationsTableRows = "";
  (medications ?? []).forEach((medication) => {
    medicationsTableRows += `
        <tr style="font-weight: bold; background-color: #f2f2f2; border-bottom: 1px solid #ddd; padding-top: 20px;">
            <td>${medication.Drug.genericName} ${!medication.isGeneric ? `(${medication.Drug.brandName})` : ""}</td>
            <td>${medication.dosage}</td>
            <td>${medication.frequency}</td>
            <td>${medication.duration} day(s)</td>
            <td>${medication.unit}</td>
        </tr>
        <tr>
            <td colspan="5">Sig: ${medication.notes ?? ""}</td>
        </tr>
        `
  });

  const outputTemplate = template
    .replaceAll("@{patientName}", name)
    .replaceAll("@{patientAge}", age)
    .replaceAll("@{patientSex}", gender)
    .replaceAll("@{patientAddress}", address)
    .replaceAll("@{hpName}", hpName)
    .replaceAll("@{hpSpecialization}", specialization)
    .replaceAll("@{hpLicenseNumber}", licenseNumber)
    .replaceAll("@{hpPtrNumber}", ptrNumber)
    .replaceAll("@{hpSignatureUrl}", signatureUrl)
    .replaceAll("@{prescriptionDate}", prescriptionDate)
    .replaceAll("@{medications}", medicationsTableRows)

  return outputTemplate
}; 