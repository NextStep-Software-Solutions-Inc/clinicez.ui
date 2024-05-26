"use server";

import { faker } from "@faker-js/faker";
import { cache } from "react";

export type HP = ReturnType <typeof generateHP>;

const generateHP = (type: string) => {
  return {
    id: faker.string.uuid(),
    profilePhoto: faker.image.urlPicsumPhotos(),
    coverPhoto: faker.image.urlPicsumPhotos(),
    title: faker.person.prefix(),
    name: faker.person.fullName(),
    suffix: faker.person.suffix(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    credentials: {
      education: faker.helpers.arrayElements([
        "Bachelor of Science in Nursing (BSN)",
        "Associate's Degree in Nursing (ADN)",
        "Doctor of Medicine (MD)",
        "Doctor of Osteopathic Medicine (DO)",
        "Doctor of Dental Surgery (DDS)",
        "Doctor of Pharmacy (PharmD)",
        "Master's Degree in Occupational Therapy",
        "Master's Degree in Physical Therapy",
        "Master's Degree in Speech-Language Pathology",
        "Associate's Degree in Medical Assisting",
        "Bachelor's Degree in Medical Laboratory Science",
        "Associate's Degree in Radiology Technology",
        "Bachelor's Degree in Public Health",
        "Doctor of Philosophy (PhD) in Healthcare Administration",
        "Doctor of Public Health (DrPH)"
      ], 3),
      certifications: faker.helpers.arrayElements([
        "Registered Nurse (RN) License",
        "Certified Registered Nurse Anesthetist (CRNA)",
        "Certified Critical Care Nurse (CCRN)",
        "Certified Emergency Nurse (CEN)",
        "Board Certified in [Specialty] - American Board of [Specialty] (AB[Specialty])", // Replace placeholders with specific specialty (e.g., Internal Medicine - ABIM)
        "Certified Physician Assistant (PA-C)",
        "Certified Occupational Therapist (OTR/L)",
        "Certified Physical Therapist (PT)",
        "Certified Speech-Language Pathologist (SLP-CCC)",
        "Certified Medical Laboratory Scientist (MLS(ASCP))",
        "Certified Cardiovascular Technologist (CVT)",
        "Certified Radiology Technologist (RT(R))",
        "Certified Public Health (CPH)",
        "Certified in Healthcare Administration (CHA)"
      ], 5),
      experience: faker.helpers.arrayElement(["1-5 years", "5-10 years", "10-15 years", "15-20 years", "20-25 years", "25-30 years", "30-35 years", "35-40 years", "40-45 years", "45-50 years"]),
    },
    professionalDetails: {
      fields: faker.helpers.arrayElements([
        "Internal Medicine",
        "Pediatrics",
        "Family Medicine",
        "Surgery",
        "Obstetrics and Gynecology",
        "Anesthesiology",
        "Neurology",
        "Psychiatry",
        "Dermatology",
        "Ophthalmology",
        "Otolaryngology",
        "Pathology",
        "Radiology",
        "Emergency Medicine",
      ], 2),
      specialties: faker.helpers.arrayElements([
        // Doctor Specialties
        "Internal Medicine",
        "Cardiology",
        "Dermatology",
        "Endocrinology",
        "Gastroenterology",
        "Nephrology",
        "Neurology",
        "Neurosurgery",
        "Obstetrics and Gynecology",
        "Ophthalmology",
        "Orthopedic Surgery",
        "Otolaryngology",
        "Pathology",
        "Pediatrics",
        "Plastic Surgery",
        "Psychiatry",
        "Pulmonology",
        "Radiology",
        "Rheumatology",
        "Surgery",
        "Urology",
        // Nurse Specialties
        "Critical Care",
        "Emergency Room",
        "Family Practice",
        "Labor and Delivery",
        "Neonatal Intensive Care",
        "Oncology",
        "Operating Room",
        "Orthopedic",
        "Pediatric",
        "Psychiatric Mental Health",
        "Telemetry",
        // Therapist Specialties
        "Occupational Therapy",
        "Physical Therapy",
        "Speech-Language Pathology",
        "Art Therapy",
        "Dance Therapy",
        "Music Therapy",
        "Respiratory Therapy",
        // Technician Specialties
        "Cardiovascular Technologist",
        "Medical Laboratory Technician",
        "Nuclear Medicine Technologist",
        "Ophthalmic Technician",
        "Pharmacy Technician",
        "Radiologic Technologist",
        "Surgical Technologist",
        // Labaratorian Specialties
        "Blood Banking",
        "Chemistry",
        "Hematology",
        "Immunology",
        "Microbiology",
        "Molecular Pathology",
        "Transfusion Medicine",
        // Add more professions and their specialties here
      ], 3),
      languages: faker.helpers.arrayElements([
        "English", "Spanish", "French", "German", "Italian",
        "Portuguese", "Dutch", "Russian", "Chinese", "Japanese", "Korean", "Arabic", "Hindi",
        "Bengali", "Punjabi", "Telugu", "Marathi", "Tamil", "Urdu"
      ], 2),
      affiliations: faker.helpers.arrayElements([
        "American Medical Association (AMA)",
        "American Nurses Association (ANA)",
        "American Academy of Family Physicians (AAFP)",
        "American College of Physicians (ACP)",
        "American College of Surgeons (ACS)",
        "American Academy of Pediatrics (AAP)",
        "American Psychiatric Association (APA)",
        "American Dental Association (ADA)",
        "American Pharmacists Association (APhA)",
        "American Physical Therapy Association (APTA)",
        "American Occupational Therapy Association (AOTA)",
        "American Speech-Language-Hearing Association (ASHA)",
        "American Society for Clinical Laboratory Science (ASCLS)",
        "American Society of Radiologic Technologists (ASRT)",
        "American Public Health Association (APHA)",
        "American Association of Healthcare Administrative Management (AAHAM)"
      ], 3),
    },
    user_metadata: {
      philosophy: faker.lorem.paragraphs(),
      areaOfInterest: faker.lorem.sentence(),
      hobbies: faker.lorem.sentence(),
    },
    links: {
      website: faker.internet.url(),
      linkedin: faker.internet.url(),
      twitter: faker.internet.url(),
      facebook: faker.internet.url(),
    },
    type,
  }
}

export const getHPsActions = cache(async (type: string) => {
  const numberOfHps = faker.number.int({min: 5, max: 15});
  return Array.from({ length: numberOfHps }, () => generateHP(type));
})

export const getHPAction = cache(async (id: string) => {
  const type = faker.helpers.arrayElement(["Doctor", "Nurse", "Therapist", "Technician", "Labaratorian"]);
  return generateHP(type);
})