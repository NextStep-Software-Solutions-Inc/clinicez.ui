import dayjs from "@lib/day-utils";

type PrepareLaboratoryRequestPayload = {
  template: string;
  patient: {
    name: string;
    age: string;
    gender: string;
    address: string;
    birthdate: string;
  };
  doctor: {
    name: string;
    licenseNo: string;
    ptrNo: string;
    address: string;
  };
  request: {
    impression: string;
    diagnosticsByCategory: Record<string, string[]>;
    createdAt: Date | string;
  };
};

export const prepareLaboratoryRequest = (payload: PrepareLaboratoryRequestPayload): string => {
  const { template, patient, doctor, request } = payload;
  const { name, age, gender, address, birthdate } = patient;
  const { name: doctorName, licenseNo, ptrNo, address: doctorAddress } = doctor;
  const { impression, diagnosticsByCategory, createdAt } = request;

  const requestDate = dayjs(createdAt).format("MM/DD/YYYY");
  const createdDateTime = dayjs(createdAt).format("MM/DD/YYYY h:mm A");

  // Helper function to format category tests as comma-separated bold text
  const formatCategoryTests = (category: string): string => {
    const tests = diagnosticsByCategory[category] || [];
    return tests.length > 0 ? `<strong>${tests.join(", ")}</strong>` : "";
  };

  const replacements = {
    "@{name}": name,
    "@{age}": age,
    "@{gender}": gender,
    "@{address}": address,
    "@{birthdate}": birthdate,
    "@{requestDate}": requestDate,
    "@{impression}": impression,
    "@{doctorName}": doctorName,
    "@{licenseNo}": licenseNo,
    "@{ptrNo}": ptrNo,
    "@{doctorAddress}": doctorAddress,
    "@{createdDateTime}": createdDateTime,

    "@{hematologyTests}": formatCategoryTests("HEMATOLOGY"),
    "@{clinicalMicroscopyTests}": formatCategoryTests("CLINICAL MICROSCOPY") || formatCategoryTests("MICROSCOPY"),
    "@{bloodChemistryTests}": formatCategoryTests("BLOOD CHEMISTRY") || formatCategoryTests("CHEMISTRY"),
    "@{microbiologyTests}": formatCategoryTests("MICROBIOLOGY"),
    "@{hormoneAssaysTests}": formatCategoryTests("HORMONE ASSAYS") || formatCategoryTests("HORMONES"),
    "@{cardiacDiagnosticsTests}": formatCategoryTests("CARDIAC DIAGNOSTICS") || formatCategoryTests("CARDIAC") || formatCategoryTests("ECG"),
  };

  let outputTemplate = template;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    outputTemplate = outputTemplate.replaceAll(placeholder, value);
  });

  return outputTemplate;
};
