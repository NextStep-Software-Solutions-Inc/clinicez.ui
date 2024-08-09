/*
  Warnings:

  - You are about to drop the `Vitals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Vitals" DROP CONSTRAINT "Vitals_userId_fkey";

-- DropTable
DROP TABLE "Vitals";

-- CreateTable
CREATE TABLE "VitalSign" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateTaken" TIMESTAMP(3) NOT NULL,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "pulseRate" INTEGER,
    "temp" DOUBLE PRECISION,
    "spo2" DOUBLE PRECISION,
    "respRate" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
