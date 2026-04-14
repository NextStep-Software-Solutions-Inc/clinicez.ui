-- CreateTable
CREATE TABLE IF NOT EXISTS "PhRegion" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PhProvince" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhProvince_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PhMunicipality" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinceCode" TEXT NOT NULL,
    "isCity" BOOLEAN NOT NULL DEFAULT false,
    "isCapital" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhMunicipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PhBarangay" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "municipalityCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhBarangay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PhRegion_code_key" ON "PhRegion"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhRegion_code_idx" ON "PhRegion"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhRegion_isActive_idx" ON "PhRegion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PhProvince_code_key" ON "PhProvince"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhProvince_code_idx" ON "PhProvince"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhProvince_regionCode_idx" ON "PhProvince"("regionCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhProvince_isActive_idx" ON "PhProvince"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PhMunicipality_code_key" ON "PhMunicipality"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhMunicipality_code_idx" ON "PhMunicipality"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhMunicipality_provinceCode_idx" ON "PhMunicipality"("provinceCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhMunicipality_isActive_idx" ON "PhMunicipality"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PhBarangay_code_key" ON "PhBarangay"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhBarangay_code_idx" ON "PhBarangay"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhBarangay_municipalityCode_idx" ON "PhBarangay"("municipalityCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhBarangay_isActive_idx" ON "PhBarangay"("isActive");

-- AddForeignKey
ALTER TABLE "PhProvince" ADD CONSTRAINT "PhProvince_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "PhRegion"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhMunicipality" ADD CONSTRAINT "PhMunicipality_provinceCode_fkey" FOREIGN KEY ("provinceCode") REFERENCES "PhProvince"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhBarangay" ADD CONSTRAINT "PhBarangay_municipalityCode_fkey" FOREIGN KEY ("municipalityCode") REFERENCES "PhMunicipality"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
