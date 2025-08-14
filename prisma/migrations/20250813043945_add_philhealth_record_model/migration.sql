-- CreateEnum
CREATE TYPE "public"."PhilHealthMemberCategory" AS ENUM ('DIRECT', 'INDIRECT');

-- CreateTable
CREATE TABLE "public"."PhilHealthRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "pin" TEXT NOT NULL,
    "tin" TEXT,
    "philSysId" TEXT,
    "memberTypeId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "PhilHealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhilHealthMemberType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."PhilHealthMemberCategory" NOT NULL DEFAULT 'DIRECT',
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PhilHealthMemberType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhilHealthDependent" (
    "id" SERIAL NOT NULL,
    "philHealthRecordId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "suffix" TEXT,
    "relationship" TEXT,
    "dob" TIMESTAMP(3),
    "gender" "public"."Gender",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PhilHealthDependent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhilHealthRecord_pin_key" ON "public"."PhilHealthRecord"("pin");

-- CreateIndex
CREATE UNIQUE INDEX "PhilHealthRecord_tin_key" ON "public"."PhilHealthRecord"("tin");

-- CreateIndex
CREATE UNIQUE INDEX "PhilHealthRecord_philSysId_key" ON "public"."PhilHealthRecord"("philSysId");

-- CreateIndex
CREATE UNIQUE INDEX "PhilHealthMemberType_name_key" ON "public"."PhilHealthMemberType"("name");

-- AddForeignKey
ALTER TABLE "public"."PhilHealthRecord" ADD CONSTRAINT "PhilHealthRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PhilHealthRecord" ADD CONSTRAINT "PhilHealthRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PhilHealthRecord" ADD CONSTRAINT "PhilHealthRecord_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PhilHealthRecord" ADD CONSTRAINT "PhilHealthRecord_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PhilHealthRecord" ADD CONSTRAINT "PhilHealthRecord_memberTypeId_fkey" FOREIGN KEY ("memberTypeId") REFERENCES "public"."PhilHealthMemberType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PhilHealthMemberType" ADD CONSTRAINT "PhilHealthMemberType_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."PhilHealthMemberType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PhilHealthDependent" ADD CONSTRAINT "PhilHealthDependent_philHealthRecordId_fkey" FOREIGN KEY ("philHealthRecordId") REFERENCES "public"."PhilHealthRecord"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
