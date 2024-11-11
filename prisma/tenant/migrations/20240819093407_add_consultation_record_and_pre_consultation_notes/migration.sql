-- CreateTable
CREATE TABLE "ConsultationRecord" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "orgUid" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationRecordAttribute" (
    "id" SERIAL NOT NULL,
    "consultationRecordId" INTEGER NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'SOAP',
    "whitelistEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ConsultationRecordAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteContent" (
    "id" SERIAL NOT NULL,
    "consultationRecordId" INTEGER,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreConsultationNote" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "assessment" TEXT NOT NULL,
    "homeInstructions" TEXT,
    "remarks" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreConsultationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreConsultationNoteAttribute" (
    "id" SERIAL NOT NULL,
    "preConsultationNoteId" INTEGER NOT NULL,
    "whitelistEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "PreConsultationNoteAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationRecord_appointmentId_createdBy_key" ON "ConsultationRecord"("appointmentId", "createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationRecordAttribute_consultationRecordId_key" ON "ConsultationRecordAttribute"("consultationRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteContent_consultationRecordId_section_key" ON "NoteContent"("consultationRecordId", "section");

-- CreateIndex
CREATE UNIQUE INDEX "PreConsultationNote_appointmentId_createdBy_key" ON "PreConsultationNote"("appointmentId", "createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "PreConsultationNoteAttribute_preConsultationNoteId_key" ON "PreConsultationNoteAttribute"("preConsultationNoteId");

-- AddForeignKey
ALTER TABLE "ConsultationRecord" ADD CONSTRAINT "ConsultationRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRecordAttribute" ADD CONSTRAINT "ConsultationRecordAttribute_consultationRecordId_fkey" FOREIGN KEY ("consultationRecordId") REFERENCES "ConsultationRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteContent" ADD CONSTRAINT "NoteContent_consultationRecordId_fkey" FOREIGN KEY ("consultationRecordId") REFERENCES "ConsultationRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreConsultationNote" ADD CONSTRAINT "PreConsultationNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreConsultationNoteAttribute" ADD CONSTRAINT "PreConsultationNoteAttribute_preConsultationNoteId_fkey" FOREIGN KEY ("preConsultationNoteId") REFERENCES "PreConsultationNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
