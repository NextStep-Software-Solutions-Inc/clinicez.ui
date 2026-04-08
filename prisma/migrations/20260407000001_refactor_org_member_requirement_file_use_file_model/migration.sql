-- Refactor OrgMemberRequirementFile: drop inline file metadata, reference the File model instead

-- Drop the old table (created by the previous migration in this PR)
DROP TABLE IF EXISTS "OrgMemberRequirementFile";

-- Recreate with fileId FK pointing to the existing File model
CREATE TABLE "OrgMemberRequirementFile" (
    "id" SERIAL NOT NULL,
    "orgMemberId" INTEGER NOT NULL,
    "requirementType" TEXT NOT NULL,
    "fileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgMemberRequirementFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrgMemberRequirementFile_orgMemberId_requirementType_idx" ON "OrgMemberRequirementFile"("orgMemberId", "requirementType");

DO $$ BEGIN
  ALTER TABLE "OrgMemberRequirementFile" ADD CONSTRAINT "OrgMemberRequirementFile_orgMemberId_fkey"
    FOREIGN KEY ("orgMemberId") REFERENCES "OrganizationMember"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrgMemberRequirementFile" ADD CONSTRAINT "OrgMemberRequirementFile_fileId_fkey"
    FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
