-- CreateTable
CREATE TABLE "OrgConsultationConfig" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "NoteTemplateId" INTEGER NOT NULL,

    CONSTRAINT "OrgConsultationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NoteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSection" (
    "id" SERIAL NOT NULL,
    "noteTemplateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NoteSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgConsultationConfig_orgId_key" ON "OrgConsultationConfig"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteTemplate_name_key" ON "NoteTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NoteSection_noteTemplateId_name_key" ON "NoteSection"("noteTemplateId", "name");

-- AddForeignKey
ALTER TABLE "OrgConsultationConfig" ADD CONSTRAINT "OrgConsultationConfig_NoteTemplateId_fkey" FOREIGN KEY ("NoteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgConsultationConfig" ADD CONSTRAINT "OrgConsultationConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NoteSection" ADD CONSTRAINT "NoteSection_noteTemplateId_fkey" FOREIGN KEY ("noteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
