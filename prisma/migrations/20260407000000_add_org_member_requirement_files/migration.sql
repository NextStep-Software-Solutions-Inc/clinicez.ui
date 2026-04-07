-- CreateTable
CREATE TABLE IF NOT EXISTS "OrgMemberRequirementFile" (
    "id" SERIAL NOT NULL,
    "orgMemberId" INTEGER NOT NULL,
    "requirementType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgMemberRequirementFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrgMemberRequirementFile_orgMemberId_requirementType_idx" ON "OrgMemberRequirementFile"("orgMemberId", "requirementType");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "OrgMemberRequirementFile" ADD CONSTRAINT "OrgMemberRequirementFile_orgMemberId_fkey" FOREIGN KEY ("orgMemberId") REFERENCES "OrganizationMember"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
