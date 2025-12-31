-- Migration: Add citizenship and isPermanentlyDisabled to PhilHealthDependent
-- Date: 2025-12-15

-- Add citizenship field (nullable string)
ALTER TABLE "PhilHealthDependent" ADD COLUMN "citizenship" TEXT;

-- Add isPermanentlyDisabled field (boolean with default false)
ALTER TABLE "PhilHealthDependent" ADD COLUMN "isPermanentlyDisabled" BOOLEAN NOT NULL DEFAULT false;
