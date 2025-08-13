-- CreateTable
CREATE TABLE "public"."PhilHealthRecordMemberType" (
    "id" SERIAL NOT NULL,
    "philHealthRecordId" INTEGER NOT NULL,
    "memberTypeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhilHealthRecordMemberType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhilHealthRecordMemberType_philHealthRecordId_memberTypeId_key" ON "public"."PhilHealthRecordMemberType"("philHealthRecordId", "memberTypeId");

-- AddForeignKey
ALTER TABLE "public"."PhilHealthRecordMemberType" ADD CONSTRAINT "PhilHealthRecordMemberType_philHealthRecordId_fkey" FOREIGN KEY ("philHealthRecordId") REFERENCES "public"."PhilHealthRecord"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PhilHealthRecordMemberType" ADD CONSTRAINT "PhilHealthRecordMemberType_memberTypeId_fkey" FOREIGN KEY ("memberTypeId") REFERENCES "public"."PhilHealthMemberType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
