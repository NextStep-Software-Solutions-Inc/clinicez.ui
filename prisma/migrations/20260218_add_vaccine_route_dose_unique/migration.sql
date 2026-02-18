-- AlterTable Vaccine - Add unique constraint on name
ALTER TABLE "Vaccine" ADD CONSTRAINT "Vaccine_name_key" UNIQUE ("name");

-- AlterTable Route - Add unique constraint on route
ALTER TABLE "Route" ADD CONSTRAINT "Route_route_key" UNIQUE ("route");

-- AlterTable Dose - Add unique constraint on dose
ALTER TABLE "Dose" ADD CONSTRAINT "Dose_dose_key" UNIQUE ("dose");
