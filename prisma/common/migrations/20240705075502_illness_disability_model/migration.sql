-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'CRITICAL', 'PROFOUND', 'UNKNOWN');

-- CreateTable
CREATE TABLE "HealthCondition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HealthCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHealthCondition" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "healthConditionId" INTEGER NOT NULL,
    "dateDiagnosed" TIMESTAMP(3) NOT NULL,
    "severity" "Severity" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "UserHealthCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disablity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Disablity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDisability" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "disabilityId" INTEGER NOT NULL,
    "dateDiagnosed" TIMESTAMP(3) NOT NULL,
    "severity" "Severity" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "UserDisability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthCondition_name_key" ON "HealthCondition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserHealthCondition_userId_healthConditionId_key" ON "UserHealthCondition"("userId", "healthConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "Disablity_name_key" ON "Disablity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserDisability_userId_disabilityId_key" ON "UserDisability"("userId", "disabilityId");

-- AddForeignKey
ALTER TABLE "UserHealthCondition" ADD CONSTRAINT "UserHealthCondition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserHealthCondition" ADD CONSTRAINT "UserHealthCondition_healthConditionId_fkey" FOREIGN KEY ("healthConditionId") REFERENCES "HealthCondition"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDisability" ADD CONSTRAINT "UserDisability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDisability" ADD CONSTRAINT "UserDisability_disabilityId_fkey" FOREIGN KEY ("disabilityId") REFERENCES "Disablity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
