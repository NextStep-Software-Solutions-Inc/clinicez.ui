/*
  Warnings:

  - A unique constraint covering the columns `[userOrgAppointmentWhitelistId,filterId,value]` on the table `WhitelistFilter` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WhitelistFilter_userOrgAppointmentWhitelistId_filterId_key";

-- CreateIndex
CREATE UNIQUE INDEX "WhitelistFilter_userOrgAppointmentWhitelistId_filterId_valu_key" ON "WhitelistFilter"("userOrgAppointmentWhitelistId", "filterId", "value");
