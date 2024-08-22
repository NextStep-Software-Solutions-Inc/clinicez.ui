-- CreateTable
CREATE TABLE "AppointmentTypeAttribute" (
    "id" SERIAL NOT NULL,
    "appointmentTypeId" INTEGER NOT NULL,
    "requirments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reminders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 30,
    "durationPadding" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "AppointmentTypeAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAttribute" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "requirments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reminders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 30,
    "durationPadding" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ServiceAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTypeAttribute_appointmentTypeId_key" ON "AppointmentTypeAttribute"("appointmentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAttribute_serviceId_key" ON "ServiceAttribute"("serviceId");

-- AddForeignKey
ALTER TABLE "AppointmentTypeAttribute" ADD CONSTRAINT "AppointmentTypeAttribute_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAttribute" ADD CONSTRAINT "ServiceAttribute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
