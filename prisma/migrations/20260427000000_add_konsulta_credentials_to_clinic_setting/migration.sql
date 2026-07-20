-- AlterTable
ALTER TABLE "ClinicSetting" ADD COLUMN IF NOT EXISTS "konsultaUsername" TEXT,
ADD COLUMN IF NOT EXISTS "konsultaPassword" TEXT,
ADD COLUMN IF NOT EXISTS "pmccNumber" TEXT,
ADD COLUMN IF NOT EXISTS "konsultaCipherKey" TEXT;
