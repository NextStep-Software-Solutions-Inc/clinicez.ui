-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "education" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "NurseProfile" ADD COLUMN     "education" TEXT[] DEFAULT ARRAY[]::TEXT[];
