// Use CommonJS for broad Node compatibility when running `node prisma/seed-procedures.js`
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const imagingProcedures = [
  { name: 'X-RAY', description: 'X-Ray Imaging', category: 'Imaging Procedures', isActive: true },
  { name: 'MRI', description: 'Magnetic Resonance Imaging', category: 'Imaging Procedures', isActive: true },
  { name: 'CT', description: 'Computed Tomography', category: 'Imaging Procedures', isActive: true },
  { name: 'ULTRASOUND', description: 'Ultrasound Imaging', category: 'Imaging Procedures', isActive: true },
  { name: 'FLUOROSCOPY', description: 'Fluoroscopy Imaging', category: 'Imaging Procedures', isActive: true },
  { name: 'BREAST IMAGING', description: 'Breast Imaging / Mammography', category: 'Imaging Procedures', isActive: true },
  { name: 'NUCLEAR MEDICINE', description: 'Nuclear Medicine Imaging', category: 'Imaging Procedures', isActive: true },
  { name: 'DENSITOMETRY', description: 'Bone Densitometry', category: 'Imaging Procedures', isActive: true },
];

const laboratoryProcedures = [
  // HEMATOLOGY
  { name: 'CBC with Platelet', description: 'Complete Blood Count with Platelet', category: 'HEMATOLOGY', isActive: true },
  { name: 'Blood Typing', description: 'Blood Type Determination', category: 'HEMATOLOGY', isActive: true },
  { name: 'ESR', description: 'Erythrocyte Sedimentation Rate', category: 'HEMATOLOGY', isActive: true },
  { name: 'Retic Count', description: 'Reticulocyte Count', category: 'HEMATOLOGY', isActive: true },

  // CLINICAL MICROSCOPY
  { name: 'U/A - Urinalysis', description: 'Urinalysis', category: 'CLINICAL MICROSCOPY', isActive: true },
  { name: 'S/E - Fecalis', description: 'Stool Examination - Fecalis', category: 'CLINICAL MICROSCOPY', isActive: true },
  { name: 'Fecal Occult Blood', description: 'Fecal Occult Blood Test', category: 'CLINICAL MICROSCOPY', isActive: true },
  { name: 'H. pylori Antigen', description: 'Helicobacter pylori Antigen', category: 'CLINICAL MICROSCOPY', isActive: true },
  { name: 'Pregnancy Test', description: 'Pregnancy Test', category: 'CLINICAL MICROSCOPY', isActive: true },

  // MICROBIOLOGY
  { name: 'Urine GS/CS', description: 'Urine Gram Stain and Culture/Sensitivity', category: 'MICROBIOLOGY', isActive: true },
  { name: 'Blood GS/CS', description: 'Blood Gram Stain and Culture/Sensitivity', category: 'MICROBIOLOGY', isActive: true },
  { name: 'Sputum AFB', description: 'Sputum Acid-Fast Bacilli', category: 'MICROBIOLOGY', isActive: true },
  { name: 'Sputum GeneXpert', description: 'Sputum GeneXpert Test', category: 'MICROBIOLOGY', isActive: true },

  // COVID-19 TEST
  { name: 'Rapid Antigen Test', description: 'COVID-19 Rapid Antigen Test', category: 'COVID-19 TEST', isActive: true },
  { name: 'RT-PCR', description: 'COVID-19 RT-PCR Test', category: 'COVID-19 TEST', isActive: true },
  { name: 'Nasopharyngeal Swab', description: 'COVID-19 Nasopharyngeal Swab', category: 'COVID-19 TEST', isActive: true },

  // CARDIAC MARKERS
  { name: 'CK-MB', description: 'Creatine Kinase-MB', category: 'CARDIAC MARKERS', isActive: true },
  { name: 'HS TROP I', description: 'High Sensitivity Troponin I', category: 'CARDIAC MARKERS', isActive: true },
  { name: 'PRO-BNP', description: 'Pro-Brain Natriuretic Peptide', category: 'CARDIAC MARKERS', isActive: true },
  { name: 'TROP T (QUANTI)', description: 'Troponin T Quantitative', category: 'CARDIAC MARKERS', isActive: true },
  { name: 'TROP T (QUALI)', description: 'Troponin T Qualitative', category: 'CARDIAC MARKERS', isActive: true },
  { name: 'D-DIMER', description: 'D-Dimer Test', category: 'CARDIAC MARKERS', isActive: true },

  // BLOOD CHEMISTRY
  { name: 'FBS Fasting Blood Glucose', description: 'Fasting Blood Sugar', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'RBS Random Blood Glucose', description: 'Random Blood Sugar', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Creatinine', description: 'Serum Creatinine', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Uric Acid', description: 'Serum Uric Acid', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'BUN', description: 'Blood Urea Nitrogen', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Lipid Profile', description: 'Complete Lipid Profile', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'SGPT/ALT', description: 'Serum Glutamic-Pyruvic Transaminase / Alanine Aminotransferase', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'SGOT/AST', description: 'Serum Glutamic-Oxaloacetic Transaminase / Aspartate Aminotransferase', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Total Bilirubin', description: 'Total Bilirubin', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Direct Bilirubin', description: 'Direct Bilirubin', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'HbA1c', description: 'Glycated Hemoglobin', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'ABG', description: 'Arterial Blood Gas', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Alkaline Phosphatase', description: 'Alkaline Phosphatase', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Alpha Fetoprotein', description: 'Alpha-Fetoprotein', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Sodium', description: 'Serum Sodium', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Potassium', description: 'Serum Potassium', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Calcium', description: 'Serum Calcium', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Ionized Calcium', description: 'Ionized Calcium', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Magnesium', description: 'Serum Magnesium', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Chloride', description: 'Serum Chloride', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Amylase', description: 'Serum Amylase', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Iron', description: 'Serum Iron', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'LDH', description: 'Lactate Dehydrogenase', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Procalcitonin', description: 'Procalcitonin', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Total Protein', description: 'Total Protein', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Albumin', description: 'Serum Albumin', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'Globulin', description: 'Serum Globulin', category: 'BLOOD CHEMISTRY', isActive: true },
  { name: 'A/G Ratio', description: 'Albumin/Globulin Ratio', category: 'BLOOD CHEMISTRY', isActive: true },

  // SEROLOGY AND IMMUNOLOGY
  { name: 'ASO Titer', description: 'Antistreptolysin O Titer', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'CRP', description: 'C-Reactive Protein', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Tubex', description: 'Tubex Test for Typhoid', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Typhidot', description: 'Typhidot Test', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Ferritin', description: 'Serum Ferritin', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Dengue NS1 Ag', description: 'Dengue NS1 Antigen', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Dengue NS1 IgG/IgM', description: 'Dengue NS1 IgG/IgM', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Anti HCV', description: 'Hepatitis C Antibody', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Anti HBS', description: 'Hepatitis B Surface Antibody', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Anti HAV IgG', description: 'Hepatitis A Virus IgG', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Anti HAV IgM', description: 'Hepatitis A Virus IgM', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'HBsAg Screening', description: 'Hepatitis B Surface Antigen Screening', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Anti HCV Screening', description: 'Hepatitis C Antibody Screening', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'CA 125', description: 'Cancer Antigen 125', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'CA 15-3', description: 'Cancer Antigen 15-3', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'CA 19-9', description: 'Cancer Antigen 19-9', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Total PSA', description: 'Total Prostate-Specific Antigen', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Free PSA', description: 'Free Prostate-Specific Antigen', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Beta HCG', description: 'Beta Human Chorionic Gonadotropin', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'Prolactin', description: 'Serum Prolactin', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'TSH', description: 'Thyroid Stimulating Hormone', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'FT3', description: 'Free Triiodothyronine', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'FT4', description: 'Free Thyroxine', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'HIV Screening', description: 'HIV Screening Test', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
  { name: 'HIV (EIA)', description: 'HIV Enzyme Immunoassay', category: 'SEROLOGY AND IMMUNOLOGY', isActive: true },
];

const heartStationProcedures = [
  { name: '12 Lead ECG', description: '12 Lead Electrocardiogram', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: '15 Lead ECG', description: '15 Lead Electrocardiogram', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Stress Test', description: 'Cardiac Stress Test', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: '24 Holter Monitoring', description: '24 Hour Holter Monitoring', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: '24 Ambulatory BP', description: '24 Hour Ambulatory Blood Pressure Monitoring', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Carotid Scan', description: 'Carotid Ultrasound Scan', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Transesophageal Echocardiogram (TEE)', description: 'Transesophageal Echocardiogram', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Stress Echo', description: 'Stress Echocardiogram', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Dobutamine Stress Test', description: 'Dobutamine Stress Echocardiogram', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: '2d Echocardiogram Plain', description: '2D Echocardiogram Plain', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: '2d Echocardiogram Doppler', description: '2D Echocardiogram with Doppler', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Venous Duplex Scan (Upper) - R leg', description: 'Venous Duplex Scan Upper Right Leg', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Venous Duplex Scan (Upper) - L leg', description: 'Venous Duplex Scan Upper Left Leg', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'DVT Screening - R leg', description: 'Deep Vein Thrombosis Screening Right Leg', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'DVT Screening - L leg', description: 'Deep Vein Thrombosis Screening Left Leg', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Arterial Duplex Scan (Upper) - R arm', description: 'Arterial Duplex Scan Upper Right Arm', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Arterial Duplex Scan (Upper) - L arm', description: 'Arterial Duplex Scan Upper Left Arm', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Arterial Duplex Scan (Lower) - R leg', description: 'Arterial Duplex Scan Lower Right Leg', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
  { name: 'Arterial Duplex Scan (Lower) - L leg', description: 'Arterial Duplex Scan Lower Left Leg', category: 'CARDIOVASCULAR PROCEDURES', isActive: true },
];

async function seedProcedures() {
  console.log('Starting procedure seeding...');

  try {
    // Seed Imaging Procedures
    console.log('Seeding Imaging Procedures...');
    for (const procedure of imagingProcedures) {
      await prisma.imagingProcedure.upsert({
        where: {
          unique_imaging_procedure: {
            name: procedure.name,
            category: procedure.category,
          },
        },
        update: {},
        create: procedure,
      });
    }
    console.log(`✓ Seeded ${imagingProcedures.length} imaging procedures`);

    // Seed Laboratory Procedures
    console.log('Seeding Laboratory Procedures...');
    for (const procedure of laboratoryProcedures) {
      await prisma.laboratoryProcedure.upsert({
        where: {
          unique_laboratory_procedure: {
            name: procedure.name,
            category: procedure.category,
          },
        },
        update: {},
        create: procedure,
      });
    }
    console.log(`✓ Seeded ${laboratoryProcedures.length} laboratory procedures`);

    // Seed Heart Station Procedures
    console.log('Seeding Heart Station Procedures...');
    for (const procedure of heartStationProcedures) {
      await prisma.heartStationProcedure.upsert({
        where: {
          unique_heart_station_procedure: {
            name: procedure.name,
            category: procedure.category,
          },
        },
        update: {},
        create: procedure,
      });
    }
    console.log(`✓ Seeded ${heartStationProcedures.length} heart station procedures`);

    console.log('\n✅ All procedures seeded successfully!');
    console.log(`Total: ${imagingProcedures.length + laboratoryProcedures.length + heartStationProcedures.length} procedures`);
  } catch (error) {
    console.error('Error seeding procedures:', error);
    throw error;
  }
}

(async () => {
  try {
    await seedProcedures();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
