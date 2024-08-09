-- CreateTable
CREATE TABLE "Vitals" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateTaken" TIMESTAMP(3) NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "bpSystolic" INTEGER NOT NULL,
    "bpDiastolic" INTEGER NOT NULL,
    "pulseRate" INTEGER NOT NULL,
    "temp" DOUBLE PRECISION NOT NULL,
    "spo2" DOUBLE PRECISION NOT NULL,
    "respRate" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Vitals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vitals" ADD CONSTRAINT "Vitals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
