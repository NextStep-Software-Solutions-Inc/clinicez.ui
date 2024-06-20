/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "CivilStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'RH_POSITIVE', 'RH_NEGATIVE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "bloodType" "BloodType",
ADD COLUMN     "civilStatus" "CivilStatus",
ADD COLUMN     "dob" DATE,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "suffix" TEXT,
ADD COLUMN     "telephone" TEXT;
