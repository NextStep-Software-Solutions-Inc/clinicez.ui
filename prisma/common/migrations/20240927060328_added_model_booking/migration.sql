-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "jobId" TEXT NOT NULL,
    "routingCode" TEXT,
    "bookedFor" INTEGER NOT NULL,
    "bookedBy" INTEGER NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL,
    "meetingLink" TEXT,
    "platform" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_jobId_key" ON "Booking"("jobId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookedBy_fkey" FOREIGN KEY ("bookedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookedFor_fkey" FOREIGN KEY ("bookedFor") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
