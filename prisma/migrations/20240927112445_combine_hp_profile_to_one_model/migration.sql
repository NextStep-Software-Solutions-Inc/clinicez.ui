/*
  Warnings:

  - You are about to drop the `DoctorProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NurseProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DoctorProfile" DROP CONSTRAINT "DoctorProfile_healthcareProviderId_fkey";

-- DropForeignKey
ALTER TABLE "NurseProfile" DROP CONSTRAINT "NurseProfile_healthcareProviderId_fkey";

-- DropTable
DROP TABLE "DoctorProfile";

-- DropTable
DROP TABLE "NurseProfile";

-- CreateTable
CREATE TABLE "HPProfile" (
    "id" SERIAL NOT NULL,
    "healthcareProviderId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "suffix" TEXT,
    "picture" TEXT,
    "cover" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "affiliations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "areaOfInterest" TEXT,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" TEXT,
    "fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hobbies" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "philosophy" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workEmail" TEXT,
    "workPhone" TEXT,
    "educations" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "HPProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HPProfile_healthcareProviderId_key" ON "HPProfile"("healthcareProviderId");

-- AddForeignKey
ALTER TABLE "HPProfile" ADD CONSTRAINT "HPProfile_healthcareProviderId_fkey" FOREIGN KEY ("healthcareProviderId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
