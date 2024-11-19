-- CreateTable
CREATE TABLE "ReservedTimeSlot" (
    "id" SERIAL NOT NULL,
    "jobId" TEXT NOT NULL,
    "hpId" INTEGER NOT NULL,
    "reservedBy" INTEGER NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservedTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservedTimeSlot_jobId_key" ON "ReservedTimeSlot"("jobId");

-- CreateIndex
CREATE INDEX "reserved_time_slot_index" ON "ReservedTimeSlot"("hpId", "reservedBy", "startDateTime", "endDateTime");

-- AddForeignKey
ALTER TABLE "ReservedTimeSlot" ADD CONSTRAINT "ReservedTimeSlot_reservedBy_fkey" FOREIGN KEY ("reservedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ReservedTimeSlot" ADD CONSTRAINT "ReservedTimeSlot_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
