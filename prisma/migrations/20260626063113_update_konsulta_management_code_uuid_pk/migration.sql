/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `KonsultaManagementCode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `KonsultaManagementCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KonsultaManagementCode" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaManagementCode_code_key" ON "KonsultaManagementCode"("code");
