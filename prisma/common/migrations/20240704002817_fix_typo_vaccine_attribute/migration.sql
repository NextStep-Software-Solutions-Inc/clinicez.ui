/*
  Warnings:

  - You are about to drop the `VaccineAttritube` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VaccineAttritube" DROP CONSTRAINT "VaccineAttritube_vaccineId_fkey";

-- DropTable
DROP TABLE "VaccineAttritube";

-- CreateTable
CREATE TABLE "VaccineAttribute" (
    "id" SERIAL NOT NULL,
    "vaccineId" INTEGER NOT NULL,
    "effectivity" INTEGER NOT NULL,

    CONSTRAINT "VaccineAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VaccineAttribute_vaccineId_key" ON "VaccineAttribute"("vaccineId");

-- AddForeignKey
ALTER TABLE "VaccineAttribute" ADD CONSTRAINT "VaccineAttribute_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
