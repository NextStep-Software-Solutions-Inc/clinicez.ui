/*
  Warnings:

  - You are about to drop the column `description` on the `VaccineDose` table. All the data in the column will be lost.
  - You are about to drop the column `dose` on the `VaccineDose` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `VaccineDose` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `VaccineRoute` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `VaccineRoute` table. All the data in the column will be lost.
  - You are about to drop the column `route` on the `VaccineRoute` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vaccineId,doseId]` on the table `VaccineDose` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vaccineId,routeId]` on the table `VaccineRoute` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `doseId` to the `VaccineDose` table without a default value. This is not possible if the table is not empty.
  - Made the column `vaccineId` on table `VaccineDose` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `routeId` to the `VaccineRoute` table without a default value. This is not possible if the table is not empty.
  - Made the column `vaccineId` on table `VaccineRoute` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserVaccination" DROP CONSTRAINT "UserVaccination_doseId_fkey";

-- DropForeignKey
ALTER TABLE "UserVaccination" DROP CONSTRAINT "UserVaccination_routeId_fkey";

-- AlterTable
ALTER TABLE "VaccineDose" DROP COLUMN "description",
DROP COLUMN "dose",
DROP COLUMN "isActive",
ADD COLUMN     "doseId" INTEGER NOT NULL,
ALTER COLUMN "vaccineId" SET NOT NULL;

-- AlterTable
ALTER TABLE "VaccineRoute" DROP COLUMN "description",
DROP COLUMN "isActive",
DROP COLUMN "route",
ADD COLUMN     "routeId" INTEGER NOT NULL,
ALTER COLUMN "vaccineId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Route" (
    "id" SERIAL NOT NULL,
    "route" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dose" (
    "id" SERIAL NOT NULL,
    "dose" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Dose_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VaccineDose_vaccineId_doseId_key" ON "VaccineDose"("vaccineId", "doseId");

-- CreateIndex
CREATE UNIQUE INDEX "VaccineRoute_vaccineId_routeId_key" ON "VaccineRoute"("vaccineId", "routeId");

-- AddForeignKey
ALTER TABLE "VaccineRoute" ADD CONSTRAINT "VaccineRoute_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineDose" ADD CONSTRAINT "VaccineDose_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
