/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `HealthCondition` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "HealthCondition" ADD COLUMN     "code" TEXT,
ADD COLUMN     "libraryStatus" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "HealthCondition_code_key" ON "HealthCondition"("code");
