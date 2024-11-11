-- CreateTable
CREATE TABLE "Vaccine" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Vaccine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccineAttritube" (
    "id" SERIAL NOT NULL,
    "vaccineId" INTEGER NOT NULL,
    "effectivity" INTEGER NOT NULL,

    CONSTRAINT "VaccineAttritube_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccineRoute" (
    "id" SERIAL NOT NULL,
    "vaccineId" INTEGER,
    "route" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VaccineRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccineDose" (
    "id" SERIAL NOT NULL,
    "vaccineId" INTEGER,
    "dose" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VaccineDose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVaccination" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vaccineId" INTEGER NOT NULL,
    "doseId" INTEGER NOT NULL,
    "routeId" INTEGER NOT NULL,
    "dateGiven" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "administeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserVaccination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VaccineAttritube_vaccineId_key" ON "VaccineAttritube"("vaccineId");

-- AddForeignKey
ALTER TABLE "VaccineAttritube" ADD CONSTRAINT "VaccineAttritube_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineRoute" ADD CONSTRAINT "VaccineRoute_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineDose" ADD CONSTRAINT "VaccineDose_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "VaccineDose"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VaccineRoute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
