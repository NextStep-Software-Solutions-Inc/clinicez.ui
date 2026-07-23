-- CreateTable
CREATE TABLE "PatientNcdQuestionnaire" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "q1" TEXT,
    "q2" TEXT,
    "q3" TEXT,
    "q4" TEXT,
    "q5" TEXT,
    "q6" TEXT,
    "q7" TEXT,
    "q8" TEXT,
    "q9" TEXT,
    "q10" TEXT,
    "q11" TEXT,
    "q12" TEXT,
    "q13" TEXT,
    "q14" TEXT,
    "q15" TEXT,
    "q16" TEXT,
    "q17" TEXT,
    "q18" TEXT,
    "q19" TEXT,
    "q20" TEXT,
    "q21" TEXT,
    "q22" TEXT,
    "q23" TEXT,
    "q24" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientNcdQuestionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientNcdQuestionnaire_patientId_key" ON "PatientNcdQuestionnaire"("patientId");

-- AddForeignKey
ALTER TABLE "PatientNcdQuestionnaire" ADD CONSTRAINT "PatientNcdQuestionnaire_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
