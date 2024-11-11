-- AlterTable
ALTER TABLE "HealthcareProviderType" ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "HealthcareProviderType_pkey" PRIMARY KEY ("id");
