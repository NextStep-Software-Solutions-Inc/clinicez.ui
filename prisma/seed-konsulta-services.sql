-- Clear existing data
DELETE FROM "KonsultaRecommendedService";

-- Insert Annex B Rules using correct Diagnostic IDs from lib_diagnostic.xlsx
INSERT INTO "KonsultaRecommendedService" ("id", "minAgeMonths", "maxAgeMonths", "gender", "consultationDescription", "philhealthDiagnosticIds") VALUES
(gen_random_uuid(), 0, 12, null, 'History and physical examination (vitals, anthropometrics)', ARRAY['1']),
(gen_random_uuid(), 13, 59, null, 'History and physical examination (vitals, anthropometrics)', ARRAY['1', '3', '2']),
(gen_random_uuid(), 60, 119, null, 'History and physical examination (vitals, anthropometrics, BMI)', ARRAY['1', '3', '2', '17']),
(gen_random_uuid(), 120, 239, null, 'History and physical examination (anthropometrics, BMI, BP)', ARRAY['1', '3', '2', '13', '4']),
(gen_random_uuid(), 240, 719, 'FEMALE', 'History and physical examination (vital signs, BMI)', ARRAY['1', '2', '13', '4', '5', '14', '9', '6', '7', '8', '15']),
(gen_random_uuid(), 240, 719, 'MALE', 'History and physical examination (vital signs, BMI)', ARRAY['1', '2', '4', '5', '14', '9', '6', '7', '8', '15']),
(gen_random_uuid(), 720, null, 'FEMALE', 'History and physical examination (vital signs, BMI)', ARRAY['2', '4', '5', '14', '9', '6', '7', '8', '15']),
(gen_random_uuid(), 720, null, 'MALE', 'History and physical examination (vital signs, BMI)', ARRAY['2', '4', '5', '14', '9', '6', '7', '8', '15']);

-- Clear existing data
DELETE FROM "DiagnosticProcedure";

-- Insert PhilHealth Diagnostic Procedures
INSERT INTO "DiagnosticProcedure" ("id", "name", "category", "isActive", "philhealthDiagnosticId") VALUES
(gen_random_uuid(), 'Complete Blood Count', 'HEMATOLOGY', true, '1'),
(gen_random_uuid(), 'Urinalysis', 'CLINICAL MICROSCOPY', true, '2'),
(gen_random_uuid(), 'Fecalysis', 'CLINICAL MICROSCOPY', true, '3'),
(gen_random_uuid(), 'Chest X-Ray', 'RADIOLOGY', true, '4'),
(gen_random_uuid(), 'Sputum Microscopy', 'CLINICAL MICROSCOPY', true, '5'),
(gen_random_uuid(), 'Lipid Profile', 'CLINICAL CHEMISTRY', true, '6'),
(gen_random_uuid(), 'Fasting Blood Sugar', 'CLINICAL CHEMISTRY', true, '7'),
(gen_random_uuid(), 'Creatinine', 'CLINICAL CHEMISTRY', true, '8'),
(gen_random_uuid(), 'Electrocardiogram (ECG)', 'CARDIOLOGY', true, '9'),
(gen_random_uuid(), 'Blood Typing', 'HEMATOLOGY', false, '10'),
(gen_random_uuid(), 'Peak Expiratory Flow Meter Testing', 'PULMONOLOGY', false, '11'),
(gen_random_uuid(), 'Blood Glucose Monitoring', 'CLINICAL CHEMISTRY', false, '12'),
(gen_random_uuid(), 'Paps Smear', 'CYTOLOGY', true, '13'),
(gen_random_uuid(), 'Oral Glucose Tolerance Test', 'CLINICAL CHEMISTRY', true, '14'),
(gen_random_uuid(), 'Fecal Occult Blood', 'CLINICAL MICROSCOPY', true, '15'),
(gen_random_uuid(), 'Platelet', 'HEMATOLOGY', false, '16'),
(gen_random_uuid(), 'PPD Test (Tuberculosis)', 'IMMUNOLOGY', true, '17'),
(gen_random_uuid(), 'HbA1c', 'CLINICAL CHEMISTRY', true, '18'),
(gen_random_uuid(), 'Random Blood Sugar', 'CLINICAL CHEMISTRY', true, '19'),
(gen_random_uuid(), 'Not Applicable', 'OTHERS', true, '0'),
(gen_random_uuid(), 'Others', 'OTHERS', true, '99');
