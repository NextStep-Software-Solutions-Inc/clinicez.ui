/*
  Warnings:

  - A unique constraint covering the columns `[brandName,genericName]` on the table `Drug` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Drug_brandName_genericName_key" ON "Drug"("brandName", "genericName");
