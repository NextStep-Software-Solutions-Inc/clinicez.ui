/*
  Warnings:

  - You are about to drop the column `createdAt` on the `SocialLink` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `SocialLink` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `SocialLink` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `SocialLink` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SocialLink` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `SocialLink` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SocialLink" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "isActive",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
DROP COLUMN "url",
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "website" TEXT;

-- DropEnum
DROP TYPE "SocialLinkType";
