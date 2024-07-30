/*
  Warnings:

  - You are about to drop the column `education` on the `DoctorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `NurseProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DoctorProfile" DROP COLUMN "education",
ADD COLUMN     "educations" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "NurseProfile" DROP COLUMN "education",
ADD COLUMN     "educations" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "OrganizationDepartment" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationProgram" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationCollege" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationCollege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentLevel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StudentLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStudentRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationRoleId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "lrn" TEXT,
    "level" INTEGER NOT NULL,
    "yearLevel" INTEGER,
    "programId" INTEGER,
    "departmentId" INTEGER,
    "collegeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserStudentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationOffice" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationOffice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEmploymentRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "organizationRoleId" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "designation" TEXT,
    "department" INTEGER,
    "office" INTEGER,
    "college" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserEmploymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationService" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "category" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationServiceCategory" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentLevel_name_key" ON "StudentLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserStudentRecord_studentId_key" ON "UserStudentRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStudentRecord_lrn_key" ON "UserStudentRecord"("lrn");

-- CreateIndex
CREATE UNIQUE INDEX "UserStudentRecord_userId_organizationId_key" ON "UserStudentRecord"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmploymentRecord_employeeId_key" ON "UserEmploymentRecord"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmploymentRecord_userId_organizationId_key" ON "UserEmploymentRecord"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationDepartment" ADD CONSTRAINT "OrganizationDepartment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationProgram" ADD CONSTRAINT "OrganizationProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCollege" ADD CONSTRAINT "OrganizationCollege_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_level_fkey" FOREIGN KEY ("level") REFERENCES "StudentLevel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_programId_fkey" FOREIGN KEY ("programId") REFERENCES "OrganizationProgram"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "OrganizationDepartment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "OrganizationCollege"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_organizationRoleId_fkey" FOREIGN KEY ("organizationRoleId") REFERENCES "UserOrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationOffice" ADD CONSTRAINT "OrganizationOffice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_department_fkey" FOREIGN KEY ("department") REFERENCES "OrganizationDepartment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_office_fkey" FOREIGN KEY ("office") REFERENCES "OrganizationOffice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_college_fkey" FOREIGN KEY ("college") REFERENCES "OrganizationCollege"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_organizationRoleId_fkey" FOREIGN KEY ("organizationRoleId") REFERENCES "UserOrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationService" ADD CONSTRAINT "OrganizationService_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationService" ADD CONSTRAINT "OrganizationService_category_fkey" FOREIGN KEY ("category") REFERENCES "OrganizationServiceCategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationServiceCategory" ADD CONSTRAINT "OrganizationServiceCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
