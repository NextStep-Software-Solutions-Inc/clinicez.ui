-- AlterTable
ALTER TABLE "DoctorProfile" ALTER COLUMN "affiliations" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "areaOfInterest" DROP NOT NULL,
ALTER COLUMN "certifications" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "experience" DROP NOT NULL,
ALTER COLUMN "fields" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "hobbies" DROP NOT NULL,
ALTER COLUMN "languages" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "philosophy" DROP NOT NULL,
ALTER COLUMN "specialties" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "workEmail" DROP NOT NULL,
ALTER COLUMN "workPhone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NurseProfile" ADD COLUMN     "affiliations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "areaOfInterest" TEXT,
ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hobbies" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "philosophy" TEXT,
ADD COLUMN     "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "workEmail" TEXT,
ADD COLUMN     "workPhone" TEXT;
