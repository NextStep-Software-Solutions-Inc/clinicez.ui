-- CreateTable
CREATE TABLE "VaccinePhilHealthData" (
    "id" TEXT NOT NULL,
    "vaccineId" INTEGER NOT NULL,
    "childImmcode" TEXT,
    "youngwImmcode" TEXT,
    "pregwImmcode" TEXT,
    "elderlyImmcode" TEXT,
    "otherImm" TEXT,

    CONSTRAINT "VaccinePhilHealthData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VaccinePhilHealthData_vaccineId_key" ON "VaccinePhilHealthData"("vaccineId");

-- AddForeignKey
ALTER TABLE "VaccinePhilHealthData" ADD CONSTRAINT "VaccinePhilHealthData_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
