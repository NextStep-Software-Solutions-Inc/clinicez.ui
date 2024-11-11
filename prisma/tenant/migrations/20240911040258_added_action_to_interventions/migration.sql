/*
  Warnings:

  - You are about to drop the column `action` on the `Intervention` table. All the data in the column will be lost.
  - Added the required column `actionId` to the `Intervention` table without a default value. This is not possible if the table is not empty.
  - Made the column `details` on table `Intervention` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Intervention" DROP COLUMN "action",
ADD COLUMN     "actionId" INTEGER NOT NULL,
ALTER COLUMN "details" SET NOT NULL;

-- CreateTable
CREATE TABLE "Action" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
