-- AlterTable
ALTER TABLE "PatientNcdQuestionnaire" ADD COLUMN     "q19_Fbsdate" TIMESTAMP(3),
ADD COLUMN     "q19_Fbsmg" TEXT,
ADD COLUMN     "q19_Fbsmmol" TEXT,
ADD COLUMN     "q20_Choledate" TIMESTAMP(3),
ADD COLUMN     "q20_Choleval" TEXT,
ADD COLUMN     "q21_Ketondate" TIMESTAMP(3),
ADD COLUMN     "q21_Ketonval" TEXT,
ADD COLUMN     "q22_Proteindate" TIMESTAMP(3),
ADD COLUMN     "q22_Proteinval" TEXT;
