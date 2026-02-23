-- AlterTable: add mimeType column to File for secure Content-Type serving
ALTER TABLE "File" ADD COLUMN "mimeType" TEXT;
