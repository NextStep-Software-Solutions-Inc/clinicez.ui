-- CreateTable
CREATE TABLE "UserOrgAppointmentWhitelist" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orgId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserOrgAppointmentWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhitelistFilter" (
    "id" SERIAL NOT NULL,
    "userOrgAppointmentWhitelistId" INTEGER NOT NULL,
    "filterId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "WhitelistFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filter" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Filter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOrgAppointmentWhitelist_userId_orgId_key" ON "UserOrgAppointmentWhitelist"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "WhitelistFilter_userOrgAppointmentWhitelistId_filterId_key" ON "WhitelistFilter"("userOrgAppointmentWhitelistId", "filterId");

-- CreateIndex
CREATE UNIQUE INDEX "Filter_key_key" ON "Filter"("key");

-- AddForeignKey
ALTER TABLE "UserOrgAppointmentWhitelist" ADD CONSTRAINT "UserOrgAppointmentWhitelist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserOrgAppointmentWhitelist" ADD CONSTRAINT "UserOrgAppointmentWhitelist_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WhitelistFilter" ADD CONSTRAINT "WhitelistFilter_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "Filter"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WhitelistFilter" ADD CONSTRAINT "WhitelistFilter_userOrgAppointmentWhitelistId_fkey" FOREIGN KEY ("userOrgAppointmentWhitelistId") REFERENCES "UserOrgAppointmentWhitelist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
