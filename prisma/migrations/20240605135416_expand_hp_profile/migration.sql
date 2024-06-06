/*
  Warnings:

  - Added the required column `areaOfInterest` to the `DoctorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experience` to the `DoctorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hobbies` to the `DoctorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `philosophy` to the `DoctorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workEmail` to the `DoctorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workPhone` to the `DoctorProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "affiliations" TEXT[],
ADD COLUMN     "areaOfInterest" TEXT NOT NULL,
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "experience" TEXT NOT NULL,
ADD COLUMN     "fields" TEXT[],
ADD COLUMN     "hobbies" TEXT NOT NULL,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "philosophy" TEXT NOT NULL,
ADD COLUMN     "specialties" TEXT[],
ADD COLUMN     "workEmail" TEXT NOT NULL,
ADD COLUMN     "workPhone" TEXT NOT NULL;
