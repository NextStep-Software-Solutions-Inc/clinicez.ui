-- CreateTable
CREATE TABLE "MedicineDispenseRecord" (
    "id" SERIAL NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "isDispensed" BOOLEAN NOT NULL DEFAULT false,
    "dateDispensed" TIMESTAMP(3),
    "dispensingPersonnel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineDispenseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicineDispenseRecord_medicineId_key" ON "MedicineDispenseRecord"("medicineId");

-- AddForeignKey
ALTER TABLE "MedicineDispenseRecord" ADD CONSTRAINT "MedicineDispenseRecord_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
