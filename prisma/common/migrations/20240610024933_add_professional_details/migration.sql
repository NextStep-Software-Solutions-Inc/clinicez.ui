-- CreateTable
CREATE TABLE "ProfessionalDetails" (
    "id" SERIAL NOT NULL,
    "healthcareProverId" INTEGER NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseIssued" TIMESTAMP(3) NOT NULL,
    "licenseExpires" TIMESTAMP(3) NOT NULL,
    "ptrNumber" TEXT NOT NULL,
    "taxNumber" TEXT NOT NULL,

    CONSTRAINT "ProfessionalDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalDetails_healthcareProverId_key" ON "ProfessionalDetails"("healthcareProverId");

-- AddForeignKey
ALTER TABLE "ProfessionalDetails" ADD CONSTRAINT "ProfessionalDetails_healthcareProverId_fkey" FOREIGN KEY ("healthcareProverId") REFERENCES "HealthcareProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
