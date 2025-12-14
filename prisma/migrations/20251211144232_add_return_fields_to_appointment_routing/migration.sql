-- AlterTable
ALTER TABLE "AppointmentRouting" ADD COLUMN     "returnReason" TEXT,
ADD COLUMN     "returnedAt" TIMESTAMP(3),
ADD COLUMN     "returnedBy" INTEGER;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_returnedBy_fkey" FOREIGN KEY ("returnedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
