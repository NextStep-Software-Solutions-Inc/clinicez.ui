"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";
import { PERMISSIONS } from "@lib/permissions";

// ──────────────────────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────────────────────
export type SeedResult = {
  status: boolean;
  message: string;
  data: { created: number; skipped: number; total: number } | null;
};

async function requireSuperAdmin(): Promise<void> {
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) throw new Error("Super admin privileges required.");
}

// ──────────────────────────────────────────────────────────────
// 1. Seed Permissions
// ──────────────────────────────────────────────────────────────
export async function seedPermissionsAction(): Promise<SeedResult> {
  try {
    await requireSuperAdmin();

    const permissions: Array<{ name: string; description: string; type: string }> = [];

    for (const permission of Object.values(PERMISSIONS.USER)) {
      permissions.push({ name: permission.name, description: permission.description, type: "USER" });
    }
    for (const permission of Object.values(PERMISSIONS.CLINIC)) {
      permissions.push({ name: permission.name, description: permission.description, type: "CLINIC" });
    }
    for (const permission of Object.values(PERMISSIONS.ORGANIZATION)) {
      permissions.push({ name: permission.name, description: permission.description, type: "ORGANIZATION" });
    }
    for (const permission of Object.values(PERMISSIONS.ADMIN)) {
      permissions.push({ name: permission.name, description: permission.description, type: "ADMIN" });
    }

    let created = 0;
    let skipped = 0;

    for (const permission of permissions) {
      const existing = await prisma.permission.findUnique({ where: { name: permission.name } });
      if (existing) {
        skipped++;
      } else {
        await prisma.permission.create({ data: permission });
        created++;
      }
    }

    return {
      status: true,
      message: `Permissions seeded. Created: ${created}, Skipped: ${skipped}`,
      data: { created, skipped, total: permissions.length },
    };
  } catch (error) {
    console.error("seedPermissionsAction error:", error);
    const message = error instanceof Error ? error.message : "Failed to seed permissions";
    return { status: false, message, data: null };
  }
}

// ──────────────────────────────────────────────────────────────
// 2. Seed Procedures (Imaging, Laboratory, Heart Station)
// ──────────────────────────────────────────────────────────────
const imagingProcedures = [
  { name: "X-RAY", description: "X-Ray Imaging", category: "Imaging Procedures", isActive: true },
  { name: "MRI", description: "Magnetic Resonance Imaging", category: "Imaging Procedures", isActive: true },
  { name: "CT", description: "Computed Tomography", category: "Imaging Procedures", isActive: true },
  { name: "ULTRASOUND", description: "Ultrasound Imaging", category: "Imaging Procedures", isActive: true },
  { name: "FLUOROSCOPY", description: "Fluoroscopy Imaging", category: "Imaging Procedures", isActive: true },
  { name: "BREAST IMAGING", description: "Breast Imaging / Mammography", category: "Imaging Procedures", isActive: true },
  { name: "NUCLEAR MEDICINE", description: "Nuclear Medicine Imaging", category: "Imaging Procedures", isActive: true },
  { name: "DENSITOMETRY", description: "Bone Densitometry", category: "Imaging Procedures", isActive: true },
];

const laboratoryProcedures = [
  { name: "CBC with Platelet", description: "Complete Blood Count with Platelet", category: "HEMATOLOGY", isActive: true },
  { name: "Blood Typing", description: "Blood Type Determination", category: "HEMATOLOGY", isActive: true },
  { name: "ESR", description: "Erythrocyte Sedimentation Rate", category: "HEMATOLOGY", isActive: true },
  { name: "Retic Count", description: "Reticulocyte Count", category: "HEMATOLOGY", isActive: true },
  { name: "U/A - Urinalysis", description: "Urinalysis", category: "CLINICAL MICROSCOPY", isActive: true },
  { name: "S/E - Fecalis", description: "Stool Examination - Fecalis", category: "CLINICAL MICROSCOPY", isActive: true },
  { name: "Fecal Occult Blood", description: "Fecal Occult Blood Test", category: "CLINICAL MICROSCOPY", isActive: true },
  { name: "H. pylori Antigen", description: "Helicobacter pylori Antigen", category: "CLINICAL MICROSCOPY", isActive: true },
  { name: "Pregnancy Test", description: "Pregnancy Test", category: "CLINICAL MICROSCOPY", isActive: true },
  { name: "Urine GS/CS", description: "Urine Gram Stain and Culture/Sensitivity", category: "MICROBIOLOGY", isActive: true },
  { name: "Blood GS/CS", description: "Blood Gram Stain and Culture/Sensitivity", category: "MICROBIOLOGY", isActive: true },
  { name: "Sputum AFB", description: "Sputum Acid-Fast Bacilli", category: "MICROBIOLOGY", isActive: true },
  { name: "Sputum GeneXpert", description: "Sputum GeneXpert Test", category: "MICROBIOLOGY", isActive: true },
  { name: "Rapid Antigen Test", description: "COVID-19 Rapid Antigen Test", category: "COVID-19 TEST", isActive: true },
  { name: "RT-PCR", description: "COVID-19 RT-PCR Test", category: "COVID-19 TEST", isActive: true },
  { name: "Nasopharyngeal Swab", description: "COVID-19 Nasopharyngeal Swab", category: "COVID-19 TEST", isActive: true },
  { name: "CK-MB", description: "Creatine Kinase-MB", category: "CARDIAC MARKERS", isActive: true },
  { name: "HS TROP I", description: "High Sensitivity Troponin I", category: "CARDIAC MARKERS", isActive: true },
  { name: "PRO-BNP", description: "Pro-Brain Natriuretic Peptide", category: "CARDIAC MARKERS", isActive: true },
  { name: "TROP T (QUANTI)", description: "Troponin T Quantitative", category: "CARDIAC MARKERS", isActive: true },
  { name: "TROP T (QUALI)", description: "Troponin T Qualitative", category: "CARDIAC MARKERS", isActive: true },
  { name: "D-DIMER", description: "D-Dimer Test", category: "CARDIAC MARKERS", isActive: true },
  { name: "FBS Fasting Blood Glucose", description: "Fasting Blood Sugar", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "RBS Random Blood Glucose", description: "Random Blood Sugar", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Creatinine", description: "Serum Creatinine", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Uric Acid", description: "Serum Uric Acid", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "BUN", description: "Blood Urea Nitrogen", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Lipid Profile", description: "Complete Lipid Profile", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "SGPT/ALT", description: "Serum Glutamic-Pyruvic Transaminase / Alanine Aminotransferase", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "SGOT/AST", description: "Serum Glutamic-Oxaloacetic Transaminase / Aspartate Aminotransferase", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Total Bilirubin", description: "Total Bilirubin", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Direct Bilirubin", description: "Direct Bilirubin", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "HbA1c", description: "Glycated Hemoglobin", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "ABG", description: "Arterial Blood Gas", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Alkaline Phosphatase", description: "Alkaline Phosphatase", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Alpha Fetoprotein", description: "Alpha-Fetoprotein", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Sodium", description: "Serum Sodium", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Potassium", description: "Serum Potassium", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Calcium", description: "Serum Calcium", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Ionized Calcium", description: "Ionized Calcium", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Magnesium", description: "Serum Magnesium", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Chloride", description: "Serum Chloride", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Amylase", description: "Serum Amylase", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Iron", description: "Serum Iron", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "LDH", description: "Lactate Dehydrogenase", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Procalcitonin", description: "Procalcitonin", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Total Protein", description: "Total Protein", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Albumin", description: "Serum Albumin", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "Globulin", description: "Serum Globulin", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "A/G Ratio", description: "Albumin/Globulin Ratio", category: "BLOOD CHEMISTRY", isActive: true },
  { name: "ASO Titer", description: "Antistreptolysin O Titer", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "CRP", description: "C-Reactive Protein", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Tubex", description: "Tubex Test for Typhoid", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Typhidot", description: "Typhidot Test", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Ferritin", description: "Serum Ferritin", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Dengue NS1 Ag", description: "Dengue NS1 Antigen", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Dengue NS1 IgG/IgM", description: "Dengue NS1 IgG/IgM", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Anti HCV", description: "Hepatitis C Antibody", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Anti HBS", description: "Hepatitis B Surface Antibody", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Anti HAV IgG", description: "Hepatitis A Virus IgG", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Anti HAV IgM", description: "Hepatitis A Virus IgM", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "HBsAg Screening", description: "Hepatitis B Surface Antigen Screening", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Anti HCV Screening", description: "Hepatitis C Antibody Screening", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "CA 125", description: "Cancer Antigen 125", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "CA 15-3", description: "Cancer Antigen 15-3", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "CA 19-9", description: "Cancer Antigen 19-9", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Total PSA", description: "Total Prostate-Specific Antigen", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Free PSA", description: "Free Prostate-Specific Antigen", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Beta HCG", description: "Beta Human Chorionic Gonadotropin", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "Prolactin", description: "Serum Prolactin", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "TSH", description: "Thyroid Stimulating Hormone", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "FT3", description: "Free Triiodothyronine", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "FT4", description: "Free Thyroxine", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "HIV Screening", description: "HIV Screening Test", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
  { name: "HIV (EIA)", description: "HIV Enzyme Immunoassay", category: "SEROLOGY AND IMMUNOLOGY", isActive: true },
];

const heartStationProcedures = [
  { name: "12 Lead ECG", description: "12 Lead Electrocardiogram", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "15 Lead ECG", description: "15 Lead Electrocardiogram", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Stress Test", description: "Cardiac Stress Test", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "24 Holter Monitoring", description: "24 Hour Holter Monitoring", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "24 Ambulatory BP", description: "24 Hour Ambulatory Blood Pressure Monitoring", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Carotid Scan", description: "Carotid Ultrasound Scan", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Transesophageal Echocardiogram (TEE)", description: "Transesophageal Echocardiogram", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Stress Echo", description: "Stress Echocardiogram", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Dobutamine Stress Test", description: "Dobutamine Stress Echocardiogram", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "2d Echocardiogram Plain", description: "2D Echocardiogram Plain", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "2d Echocardiogram Doppler", description: "2D Echocardiogram with Doppler", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Venous Duplex Scan (Upper) - R leg", description: "Venous Duplex Scan Upper Right Leg", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Venous Duplex Scan (Upper) - L leg", description: "Venous Duplex Scan Upper Left Leg", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "DVT Screening - R leg", description: "Deep Vein Thrombosis Screening Right Leg", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "DVT Screening - L leg", description: "Deep Vein Thrombosis Screening Left Leg", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Arterial Duplex Scan (Upper) - R arm", description: "Arterial Duplex Scan Upper Right Arm", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Arterial Duplex Scan (Upper) - L arm", description: "Arterial Duplex Scan Upper Left Arm", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Arterial Duplex Scan (Lower) - R leg", description: "Arterial Duplex Scan Lower Right Leg", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
  { name: "Arterial Duplex Scan (Lower) - L leg", description: "Arterial Duplex Scan Lower Left Leg", category: "CARDIOVASCULAR PROCEDURES", isActive: true },
];

export async function seedProceduresAction(): Promise<SeedResult> {
  try {
    await requireSuperAdmin();

    let created = 0;
    let skipped = 0;

    // Count existing before seeding to track actual creations
    const [imgBefore, labBefore, hsBefore] = await Promise.all([
      prisma.imagingProcedure.count(),
      prisma.laboratoryProcedure.count(),
      prisma.heartStationProcedure.count(),
    ]);

    for (const procedure of imagingProcedures) {
      await prisma.imagingProcedure.upsert({
        where: { unique_imaging_procedure: { name: procedure.name, category: procedure.category } },
        update: {},
        create: procedure,
      });
    }

    for (const procedure of laboratoryProcedures) {
      await prisma.laboratoryProcedure.upsert({
        where: { unique_laboratory_procedure: { name: procedure.name, category: procedure.category } },
        update: {},
        create: procedure,
      });
    }

    for (const procedure of heartStationProcedures) {
      await prisma.heartStationProcedure.upsert({
        where: { unique_heart_station_procedure: { name: procedure.name, category: procedure.category } },
        update: {},
        create: procedure,
      });
    }

    const [imgAfter, labAfter, hsAfter] = await Promise.all([
      prisma.imagingProcedure.count(),
      prisma.laboratoryProcedure.count(),
      prisma.heartStationProcedure.count(),
    ]);

    created = (imgAfter - imgBefore) + (labAfter - labBefore) + (hsAfter - hsBefore);
    const total = imagingProcedures.length + laboratoryProcedures.length + heartStationProcedures.length;
    skipped = total - created;

    return {
      status: true,
      message: `Procedures seeded. Imaging: ${imagingProcedures.length}, Lab: ${laboratoryProcedures.length}, Heart Station: ${heartStationProcedures.length}`,
      data: { created, skipped, total },
    };
  } catch (error) {
    console.error("seedProceduresAction error:", error);
    const message = error instanceof Error ? error.message : "Failed to seed procedures";
    return { status: false, message, data: null };
  }
}

// ──────────────────────────────────────────────────────────────
// 3. Seed PhilHealth Member Types
// ──────────────────────────────────────────────────────────────
export async function seedPhilHealthAction(): Promise<SeedResult> {
  try {
    await requireSuperAdmin();

    const before = await prisma.philHealthMemberType.count();

    await prisma.$transaction(async (tx) => {
      const directParent = await tx.philHealthMemberType.upsert({
        where: { name: "Direct Contributor" },
        update: { category: "DIRECT" },
        create: { name: "Direct Contributor", category: "DIRECT" },
      });
      const indirectParent = await tx.philHealthMemberType.upsert({
        where: { name: "Indirect Contributor" },
        update: { category: "INDIRECT" },
        create: { name: "Indirect Contributor", category: "INDIRECT" },
      });

      const directChildren = [
        "Employed Private", "Employed Government", "Professional Practitioner",
        "Self-Earning Individual", "Individual", "Sole Proprietor",
        "Group Enrollment Scheme", "Kasambahay", "Family Driver",
        "Migrant Worker - Land-Based", "Migrant Worker - Sea-Based",
        "Lifetime Member", "Filipinos with Dual Citizenship / Living Abroad",
        "Foreign National",
      ];
      const indirectChildren = [
        "Listahanan", "4Ps/MCCT", "Senior Citizen", "PAMANA", "KIA/KIPO",
        "Bangsamoro/Normalization", "LGU-sponsored", "NGA-sponsored",
        "Private-sponsored", "Person with Disability",
      ];

      for (const name of directChildren) {
        await tx.philHealthMemberType.upsert({
          where: { name },
          update: { parentId: directParent.id, category: "DIRECT" },
          create: { name, parentId: directParent.id, category: "DIRECT" },
        });
      }
      for (const name of indirectChildren) {
        await tx.philHealthMemberType.upsert({
          where: { name },
          update: { parentId: indirectParent.id, category: "INDIRECT" },
          create: { name, parentId: indirectParent.id, category: "INDIRECT" },
        });
      }
    });

    const after = await prisma.philHealthMemberType.count();
    const created = after - before;

    return {
      status: true,
      message: `PhilHealth member types seeded. Total: ${after} (added ${created} new)`,
      data: { created, skipped: after - created, total: after },
    };
  } catch (error) {
    console.error("seedPhilHealthAction error:", error);
    const message = error instanceof Error ? error.message : "Failed to seed PhilHealth member types";
    return { status: false, message, data: null };
  }
}

// ──────────────────────────────────────────────────────────────
// 4. Seed Vaccines, Routes, and Doses
// ──────────────────────────────────────────────────────────────
const vaccineRoutes = [
  { route: "Intramuscular", description: "Injection into muscle tissue" },
  { route: "Subcutaneous", description: "Injection under the skin" },
  { route: "Oral", description: "By mouth" },
  { route: "Intranasal", description: "Into the nose" },
  { route: "Intradermal", description: "Into the skin" },
];

const vaccineDoses = [
  { dose: "1st dose", description: "First dose of vaccine series" },
  { dose: "2nd dose", description: "Second dose of vaccine series" },
  { dose: "3rd dose", description: "Third dose of vaccine series" },
  { dose: "Booster", description: "Booster dose" },
  { dose: "Single dose", description: "Single dose vaccine" },
];

const vaccines = [
  { name: "COVID-19 (Pfizer)", type: "mRNA", description: "Pfizer-BioNTech COVID-19 vaccine" },
  { name: "COVID-19 (Moderna)", type: "mRNA", description: "Moderna COVID-19 vaccine" },
  { name: "COVID-19 (AstraZeneca)", type: "Viral vector", description: "AstraZeneca COVID-19 vaccine" },
  { name: "COVID-19 (Janssen)", type: "Viral vector", description: "Janssen COVID-19 vaccine" },
  { name: "Influenza (Flu)", type: "Inactivated", description: "Seasonal influenza vaccine" },
  { name: "MMR (Measles, Mumps, Rubella)", type: "Live attenuated", description: "Combined measles, mumps, and rubella vaccine" },
  { name: "DPT (Diphtheria, Pertussis, Tetanus)", type: "Inactivated", description: "Diphtheria, pertussis, and tetanus vaccine" },
  { name: "Hepatitis B", type: "Inactivated", description: "Hepatitis B vaccine" },
  { name: "Hepatitis A", type: "Inactivated", description: "Hepatitis A vaccine" },
  { name: "Polio", type: "Inactivated", description: "Poliomyelitis vaccine" },
  { name: "Tetanus", type: "Inactivated", description: "Tetanus toxoid vaccine" },
  { name: "Varicella (Chickenpox)", type: "Live attenuated", description: "Varicella-zoster vaccine" },
  { name: "Pneumococcal", type: "Inactivated", description: "Pneumococcal polysaccharide vaccine" },
  { name: "Meningococcal", type: "Conjugate", description: "Meningococcal vaccine" },
  { name: "HPV (Human Papillomavirus)", type: "Recombinant", description: "Human papillomavirus vaccine" },
  { name: "Shingles (Zoster)", type: "Recombinant", description: "Herpes zoster vaccine" },
  { name: "Yellow Fever", type: "Live attenuated", description: "Yellow fever vaccine" },
  { name: "Typhoid", type: "Inactivated", description: "Typhoid fever vaccine" },
  { name: "Rabies", type: "Inactivated", description: "Rabies vaccine" },
  { name: "Tuberculosis (BCG)", type: "Live attenuated", description: "Bacille Calmette-Guérin vaccine" },
];

export async function seedVaccinesAction(): Promise<SeedResult> {
  try {
    await requireSuperAdmin();

    let created = 0;
    let skipped = 0;

    // Routes
    for (const routeData of vaccineRoutes) {
      const existing = await prisma.route.findFirst({
        where: { route: { equals: routeData.route, mode: "insensitive" } },
      });
      if (!existing) {
        await prisma.route.create({ data: routeData });
        created++;
      } else {
        skipped++;
      }
    }

    // Doses
    for (const doseData of vaccineDoses) {
      const existing = await prisma.dose.findFirst({
        where: { dose: { equals: doseData.dose, mode: "insensitive" } },
      });
      if (!existing) {
        await prisma.dose.create({ data: doseData });
        created++;
      } else {
        skipped++;
      }
    }

    // Vaccines
    for (const vaccineData of vaccines) {
      const existing = await prisma.vaccine.findFirst({
        where: { name: { equals: vaccineData.name, mode: "insensitive" } },
      });
      if (!existing) {
        await prisma.vaccine.create({ data: vaccineData });
        created++;
      } else {
        skipped++;
      }
    }

    const total = vaccineRoutes.length + vaccineDoses.length + vaccines.length;

    return {
      status: true,
      message: `Vaccines seeded. Created: ${created}, Skipped: ${skipped}`,
      data: { created, skipped, total },
    };
  } catch (error) {
    console.error("seedVaccinesAction error:", error);
    const message = error instanceof Error ? error.message : "Failed to seed vaccines";
    return { status: false, message, data: null };
  }
}

// ──────────────────────────────────────────────────────────────
// 5. Seed All
// ──────────────────────────────────────────────────────────────
export async function seedAllAction(): Promise<SeedResult> {
  try {
    await requireSuperAdmin();

    const [permissions, procedures, philhealth, vaccinesResult] = await Promise.all([
      seedPermissionsAction(),
      seedProceduresAction(),
      seedPhilHealthAction(),
      seedVaccinesAction(),
    ]);

    const results = [permissions, procedures, philhealth, vaccinesResult];
    const failed = results.filter((r) => !r.status);

    if (failed.length > 0) {
      return {
        status: false,
        message: `Some seeds failed: ${failed.map((f) => f.message).join("; ")}`,
        data: null,
      };
    }

    const totalCreated = results.reduce((sum, r) => sum + (r.data?.created ?? 0), 0);
    const totalSkipped = results.reduce((sum, r) => sum + (r.data?.skipped ?? 0), 0);
    const totalRecords = results.reduce((sum, r) => sum + (r.data?.total ?? 0), 0);

    return {
      status: true,
      message: `All seeds completed. Created: ${totalCreated}, Skipped: ${totalSkipped}`,
      data: { created: totalCreated, skipped: totalSkipped, total: totalRecords },
    };
  } catch (error) {
    console.error("seedAllAction error:", error);
    const message = error instanceof Error ? error.message : "Failed to run all seeds";
    return { status: false, message, data: null };
  }
}
