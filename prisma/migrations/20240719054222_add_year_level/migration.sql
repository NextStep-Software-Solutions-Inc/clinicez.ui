/*
  Warnings:

  - You are about to drop the column `college` on the `UserEmploymentRecord` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `UserEmploymentRecord` table. All the data in the column will be lost.
  - You are about to drop the column `office` on the `UserEmploymentRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserEmploymentRecord" DROP CONSTRAINT "UserEmploymentRecord_college_fkey";

-- DropForeignKey
ALTER TABLE "UserEmploymentRecord" DROP CONSTRAINT "UserEmploymentRecord_department_fkey";

-- DropForeignKey
ALTER TABLE "UserEmploymentRecord" DROP CONSTRAINT "UserEmploymentRecord_office_fkey";

-- AlterTable
ALTER TABLE "UserEmploymentRecord" DROP COLUMN "college",
DROP COLUMN "department",
DROP COLUMN "office",
ADD COLUMN     "collegeId" INTEGER,
ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "officeId" INTEGER;

-- CreateTable
CREATE TABLE "OrgYearLevel" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrgYearLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgYearLevel_name_key" ON "OrgYearLevel"("name");

-- AddForeignKey
ALTER TABLE "OrgYearLevel" ADD CONSTRAINT "OrgYearLevel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_yearLevel_fkey" FOREIGN KEY ("yearLevel") REFERENCES "OrgYearLevel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "OrganizationDepartment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "OrganizationOffice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "OrganizationCollege"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
