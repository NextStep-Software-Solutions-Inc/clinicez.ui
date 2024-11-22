-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'CRITICAL', 'PROFOUND', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "CivilStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'RH_POSITIVE', 'RH_NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('TENANT', 'HEALTHCARE_PROVIDER');

-- CreateEnum
CREATE TYPE "UserPlanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_HOLD', 'CANCELLED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "Coverage" AS ENUM ('ALL', 'TENANT', 'HEALTHCARE_PROVIDER');

-- CreateEnum
CREATE TYPE "ReceiptCodeStatus" AS ENUM ('UNUSED', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "tenantUid" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userPlanId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSetting" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "onPremise" BOOLEAN NOT NULL DEFAULT false,
    "storageConnectionString" TEXT,
    "dbConnectionString" TEXT,

    CONSTRAINT "TenantSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "picture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloodType" "BloodType",
    "civilStatus" "CivilStatus",
    "dob" DATE,
    "firstName" TEXT,
    "gender" "Gender",
    "lastName" TEXT,
    "middleName" TEXT,
    "mobile" TEXT,
    "nationality" TEXT,
    "nickname" TEXT,
    "religion" TEXT,
    "suffix" TEXT,
    "telephone" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicPatient" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "patientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicPatient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicPatientPermission" (
    "id" SERIAL NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicPatientPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "autoAcceptAppointmentAssignment" BOOLEAN NOT NULL DEFAULT false,
    "autoAssignAppointmentToSelf" BOOLEAN NOT NULL DEFAULT false,
    "defaultHpId" INTEGER,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "orgUid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customUrl" TEXT,
    "email" TEXT,
    "privacyPolicyUrl" TEXT,
    "termsAndConditionsUrl" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSetting" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sendEmailNotification" BOOLEAN NOT NULL DEFAULT true,
    "emailToOrgOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrganizationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMemberPermission" (
    "id" SERIAL NOT NULL,
    "orgMemberId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "OrgMemberPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicMemberPermission" (
    "id" SERIAL NOT NULL,
    "clinicMemberId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "ClinicMemberPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgRoleInitialPermission" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "orgRoleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "OrgRoleInitialPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicRoleInitialPermission" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "clinicRoleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "ClinicRoleInitialPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "acceptedAt" DATE,
    "acceptedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "role" INTEGER NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationRole" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "OrganizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "planUid" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "firstPaymentDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "name" TEXT NOT NULL,
    "type" "PlanType" NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "planId" INTEGER NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPlan" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "UserPlanStatus" NOT NULL,

    CONSTRAINT "UserPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthcareProvider" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userPlanId" INTEGER,
    "hpTypeId" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HealthcareProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HPProfile" (
    "id" SERIAL NOT NULL,
    "healthcareProviderId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "suffix" TEXT,
    "picture" TEXT,
    "cover" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "affiliations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "areaOfInterest" TEXT,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" TEXT,
    "fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hobbies" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "philosophy" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workEmail" TEXT,
    "workPhone" TEXT,
    "educations" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "HPProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalDetails" (
    "id" SERIAL NOT NULL,
    "healthcareProverId" INTEGER NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseIssued" TIMESTAMP(3) NOT NULL,
    "licenseExpires" TIMESTAMP(3) NOT NULL,
    "ptrNumber" TEXT NOT NULL,
    "taxNumber" TEXT NOT NULL,

    CONSTRAINT "ProfessionalDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDefaultOrganization" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserDefaultOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDefaultOrganizationRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserDefaultOrganizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDefaultClinicRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserDefaultClinicRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDefaultTenant" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserDefaultTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "tiktok" TEXT,
    "twitter" TEXT,
    "website" TEXT,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptCode" (
    "id" SERIAL NOT NULL,
    "coverage" "Coverage" NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "ReceiptCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReceiptCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptCodeClaim" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "receiptCodeId" INTEGER NOT NULL,

    CONSTRAINT "ReceiptCodeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMigration" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orgId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserMigration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivationCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ActivationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolderSetting" (
    "id" SERIAL NOT NULL,
    "folderId" INTEGER NOT NULL,
    "scopeClinicId" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FolderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "folderId" INTEGER NOT NULL,
    "fileTypeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dateTaken" TIMESTAMP(3),

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileSetting" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FileSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "validUntil" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FileType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicFileType" (
    "id" SERIAL NOT NULL,
    "fileTypeId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 0,
    "dateTakenRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicFileType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEmergencyContact" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT,

    CONSTRAINT "UserEmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAddress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccine" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL,

    CONSTRAINT "Vaccine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccineAttribute" (
    "id" SERIAL NOT NULL,
    "vaccineId" INTEGER NOT NULL,
    "effectivity" INTEGER NOT NULL,

    CONSTRAINT "VaccineAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" SERIAL NOT NULL,
    "route" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dose" (
    "id" SERIAL NOT NULL,
    "dose" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Dose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccineRoute" (
    "id" SERIAL NOT NULL,
    "vaccineId" INTEGER NOT NULL,
    "routeId" INTEGER NOT NULL,

    CONSTRAINT "VaccineRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccineDose" (
    "id" SERIAL NOT NULL,
    "vaccineId" INTEGER NOT NULL,
    "doseId" INTEGER NOT NULL,

    CONSTRAINT "VaccineDose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVaccination" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vaccineId" INTEGER NOT NULL,
    "doseId" INTEGER NOT NULL,
    "routeId" INTEGER NOT NULL,
    "dateGiven" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "hpId" INTEGER,
    "administeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserVaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergen" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Allergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAllergy" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reaction" TEXT NOT NULL,
    "notes" TEXT,
    "allergenId" INTEGER NOT NULL,

    CONSTRAINT "UserAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCondition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HealthCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHealthCondition" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "healthConditionId" INTEGER NOT NULL,
    "dateDiagnosed" TIMESTAMP(3),
    "severity" "Severity" NOT NULL,
    "notes" TEXT,
    "dateResolved" TIMESTAMP(3),
    "diagnosedBy" INTEGER,
    "resolvedBy" INTEGER,
    "status" TEXT DEFAULT 'UNRESOLVED',

    CONSTRAINT "UserHealthCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disability" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Disability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDisability" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "disabilityId" INTEGER NOT NULL,
    "dateDiagnosed" TIMESTAMP(3),
    "severity" "Severity" NOT NULL,
    "notes" TEXT,
    "isManaged" BOOLEAN DEFAULT false,
    "reason" TEXT,
    "diagnosedBy" INTEGER,

    CONSTRAINT "UserDisability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalSign" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateTaken" TIMESTAMP(3) NOT NULL,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "pulseRate" INTEGER,
    "temp" DOUBLE PRECISION,
    "spo2" DOUBLE PRECISION,
    "respRate" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationDepartment" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationProgram" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "major" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationCollege" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationCollege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentLevel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StudentLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationYearLevel" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationYearLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStudentRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "lrn" TEXT,
    "level" INTEGER NOT NULL,
    "yearLevel" INTEGER,
    "programId" INTEGER,
    "departmentId" INTEGER,
    "collegeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userOrganizationRoleId" INTEGER,

    CONSTRAINT "UserStudentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserClinicAppointmentWhitelist" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserClinicAppointmentWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhitelistFilter" (
    "id" SERIAL NOT NULL,
    "userClinicAppointmentWhitelistId" INTEGER NOT NULL,
    "filterId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "WhitelistFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filter" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Filter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationOffice" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationOffice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEmploymentRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "designation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "collegeId" INTEGER,
    "departmentId" INTEGER,
    "officeId" INTEGER,
    "userOrganizationRoleId" INTEGER,

    CONSTRAINT "UserEmploymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthcareProviderType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HealthcareProviderType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSchedule" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "weekOfMonth" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'base',
    "pattern" TEXT NOT NULL DEFAULT 'weekly',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservedTimeSlot" (
    "id" SERIAL NOT NULL,
    "jobId" TEXT NOT NULL,
    "hpId" INTEGER NOT NULL,
    "reservedBy" INTEGER NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservedTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "jobId" TEXT NOT NULL,
    "routingCode" TEXT,
    "bookedFor" INTEGER NOT NULL,
    "bookedBy" INTEGER NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL,
    "meetingLink" TEXT,
    "platform" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clinicUid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customUrl" TEXT,
    "email" TEXT,
    "privacyPolicyUrl" TEXT,
    "termsAndConditionsUrl" TEXT,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicSetting" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sendEmailNotification" BOOLEAN NOT NULL DEFAULT true,
    "emailToClinicOnly" BOOLEAN NOT NULL DEFAULT false,
    "enableAppointment" BOOLEAN NOT NULL DEFAULT true,
    "enableConsultation" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicMember" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicOrganization" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicRole" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentConfig" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "maxAppointmentsPerClient" INTEGER NOT NULL DEFAULT 0,
    "lastPerClientIntervalReset" DATE,
    "perClientResetInterval" INTEGER NOT NULL DEFAULT 0,
    "maxAppointmentsPerDay" INTEGER NOT NULL DEFAULT 0,
    "lastPerDayIntervalReset" DATE,
    "privacyPolicyUrl" TEXT,
    "termsAndConditionsUrl" TEXT,

    CONSTRAINT "AppointmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationConfig" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "noteTemplateId" INTEGER NOT NULL,

    CONSTRAINT "ConsultationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NoteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSection" (
    "id" SERIAL NOT NULL,
    "noteTemplateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "showOnPatient" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NoteSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicAppointmentTab" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "appointmentTabId" INTEGER NOT NULL,

    CONSTRAINT "ClinicAppointmentTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicRoleAppointmentTab" (
    "id" SERIAL NOT NULL,
    "clinicRoleId" INTEGER NOT NULL,
    "clinicAppointmentTabId" INTEGER NOT NULL,

    CONSTRAINT "ClinicRoleAppointmentTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentTab" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppointmentTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "complaint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentAttachment" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "AppointmentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRequester" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "AppointmentRequester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentAttribute" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "maxDuration" INTEGER NOT NULL DEFAULT 30,
    "date" DATE,
    "timeStart" TEXT,
    "timeEnd" TEXT,
    "modeId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "receivedBy" INTEGER,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" INTEGER,
    "rejectedReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" INTEGER,
    "rescheduledAt" TIMESTAMP(3),
    "rescheduledBy" INTEGER,
    "rescheduledReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "preferredAppointee" INTEGER,
    "eventId" TEXT DEFAULT '',
    "meetingUrl" TEXT DEFAULT '',

    CONSTRAINT "AppointmentAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentType" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppointmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentTypeAttribute" (
    "id" SERIAL NOT NULL,
    "appointmentTypeId" INTEGER NOT NULL,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reminders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 30,
    "durationPadding" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "AppointmentTypeAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentMode" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppointmentMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRouting" (
    "id" SERIAL NOT NULL,
    "routingCode" TEXT NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "routedBy" INTEGER NOT NULL,
    "routedTo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amendment" TEXT,
    "amendedAt" TIMESTAMP(3),
    "amendedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentRouting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAttribute" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reminders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 30,
    "durationPadding" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ServiceAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationTicket" (
    "id" SERIAL NOT NULL,
    "systemId" INTEGER NOT NULL,
    "appointmentId" INTEGER,
    "clinicId" INTEGER NOT NULL,
    "subject" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConsultationTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationTicketHP" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,

    CONSTRAINT "ConsultationTicketHP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationTicketAttribute" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "noteTemplateId" INTEGER NOT NULL,
    "allowOtherHPToAddVitals" BOOLEAN NOT NULL DEFAULT false,
    "allowPatientToAddVitals" BOOLEAN NOT NULL DEFAULT false,
    "whitelistEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ConsultationTicketAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "System" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationNote" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "hpId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "showOnPatient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreAssessmentNote" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "assessment" TEXT NOT NULL,
    "homeInstructions" TEXT,
    "remarks" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreAssessmentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreAssessmentNoteAttribute" (
    "id" SERIAL NOT NULL,
    "preAssessmentNoteId" INTEGER NOT NULL,
    "whitelistEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "PreAssessmentNoteAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "medicationId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "name" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateArchived" TIMESTAMP(3),

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drug" (
    "id" SERIAL NOT NULL,
    "brandName" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "patientId" INTEGER NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationDrug" (
    "id" SERIAL NOT NULL,
    "medicationId" INTEGER NOT NULL,
    "drugId" INTEGER NOT NULL,
    "isGeneric" BOOLEAN NOT NULL DEFAULT false,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT '',
    "unit" TEXT,
    "notes" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MedicationDrug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplateType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "DocumentTemplateType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicPrescriptionSetting" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "prescriptionTemplateId" INTEGER NOT NULL,

    CONSTRAINT "ClinicPrescriptionSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_tenantUid_key" ON "Tenant"("tenantUid");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSetting_tenantId_key" ON "TenantSetting"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicPatient_clinicId_patientId_key" ON "ClinicPatient"("clinicId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_orgUid_key" ON "Organization"("orgUid");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSetting_orgId_key" ON "OrganizationSetting"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgRoleInitialPermission_orgId_orgRoleId_permissionId_key" ON "OrgRoleInitialPermission"("orgId", "orgRoleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicRoleInitialPermission_clinicId_clinicRoleId_permissio_key" ON "ClinicRoleInitialPermission"("clinicId", "clinicRoleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_role_key" ON "OrganizationMember"("userId", "organizationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationRole_orgId_name_key" ON "OrganizationRole"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_planUid_key" ON "Plan"("planUid");

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProvider_userId_hpTypeId_key" ON "HealthcareProvider"("userId", "hpTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "HPProfile_healthcareProviderId_key" ON "HPProfile"("healthcareProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalDetails_healthcareProverId_key" ON "ProfessionalDetails"("healthcareProverId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDefaultOrganization_userId_key" ON "UserDefaultOrganization"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDefaultOrganizationRole_userId_organizationId_roleId_key" ON "UserDefaultOrganizationRole"("userId", "organizationId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDefaultClinicRole_userId_clinicId_roleId_key" ON "UserDefaultClinicRole"("userId", "clinicId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDefaultTenant_userId_key" ON "UserDefaultTenant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_userId_key" ON "SocialLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptCode_code_key" ON "ReceiptCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptCodeClaim_userId_receiptCodeId_key" ON "ReceiptCodeClaim"("userId", "receiptCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMigration_userId_key" ON "UserMigration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMigration_userId_orgId_key" ON "UserMigration"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationCode_code_key" ON "ActivationCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_userId_name_key" ON "Folder"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FolderSetting_folderId_key" ON "FolderSetting"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "File_folderId_name_key" ON "File"("folderId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FileSetting_fileId_key" ON "FileSetting"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicFileType_fileTypeId_clinicId_key" ON "ClinicFileType"("fileTypeId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "VaccineAttribute_vaccineId_key" ON "VaccineAttribute"("vaccineId");

-- CreateIndex
CREATE UNIQUE INDEX "VaccineRoute_vaccineId_routeId_key" ON "VaccineRoute"("vaccineId", "routeId");

-- CreateIndex
CREATE UNIQUE INDEX "VaccineDose_vaccineId_doseId_key" ON "VaccineDose"("vaccineId", "doseId");

-- CreateIndex
CREATE UNIQUE INDEX "Allergen_name_key" ON "Allergen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserAllergy_userId_allergenId_key" ON "UserAllergy"("userId", "allergenId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthCondition_name_key" ON "HealthCondition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserHealthCondition_userId_healthConditionId_key" ON "UserHealthCondition"("userId", "healthConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "Disability_name_key" ON "Disability"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserDisability_userId_disabilityId_key" ON "UserDisability"("userId", "disabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentLevel_name_key" ON "StudentLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserStudentRecord_studentId_key" ON "UserStudentRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStudentRecord_lrn_key" ON "UserStudentRecord"("lrn");

-- CreateIndex
CREATE UNIQUE INDEX "UserStudentRecord_userId_organizationId_key" ON "UserStudentRecord"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserClinicAppointmentWhitelist_userId_clinicId_key" ON "UserClinicAppointmentWhitelist"("userId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "WhitelistFilter_userClinicAppointmentWhitelistId_filterId_v_key" ON "WhitelistFilter"("userClinicAppointmentWhitelistId", "filterId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Filter_key_key" ON "Filter"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmploymentRecord_employeeId_key" ON "UserEmploymentRecord"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmploymentRecord_userId_organizationId_key" ON "UserEmploymentRecord"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProviderType_name_key" ON "HealthcareProviderType"("name");

-- CreateIndex
CREATE INDEX "user_schedule_index" ON "UserSchedule"("userId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "ReservedTimeSlot_jobId_key" ON "ReservedTimeSlot"("jobId");

-- CreateIndex
CREATE INDEX "reserved_time_slot_index" ON "ReservedTimeSlot"("hpId", "reservedBy", "startDateTime", "endDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_jobId_key" ON "Booking"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_clinicUid_key" ON "Clinic"("clinicUid");

-- CreateIndex
CREATE INDEX "clinic_index" ON "Clinic"("tenantId", "clinicUid");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicSetting_clinicId_key" ON "ClinicSetting"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicMember_clinicId_userId_roleId_key" ON "ClinicMember"("clinicId", "userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicOrganization_clinicId_organizationId_key" ON "ClinicOrganization"("clinicId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicRole_name_key" ON "ClinicRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentConfig_clinicId_key" ON "AppointmentConfig"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationConfig_clinicId_key" ON "ConsultationConfig"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteTemplate_name_key" ON "NoteTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NoteSection_noteTemplateId_name_key" ON "NoteSection"("noteTemplateId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicAppointmentTab_clinicId_appointmentTabId_key" ON "ClinicAppointmentTab"("clinicId", "appointmentTabId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicRoleAppointmentTab_clinicRoleId_clinicAppointmentTabI_key" ON "ClinicRoleAppointmentTab"("clinicRoleId", "clinicAppointmentTabId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTab_name_key" ON "AppointmentTab"("name");

-- CreateIndex
CREATE INDEX "clinic_appointment_index" ON "Appointment"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRequester_appointmentId_userId_key" ON "AppointmentRequester"("appointmentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentAttribute_appointmentId_key" ON "AppointmentAttribute"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTypeAttribute_appointmentTypeId_key" ON "AppointmentTypeAttribute"("appointmentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRouting_routingCode_key" ON "AppointmentRouting"("routingCode");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRouting_appointmentId_routedTo_key" ON "AppointmentRouting"("appointmentId", "routedTo");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAttribute_serviceId_key" ON "ServiceAttribute"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicketHP_consultationTicketId_hpId_key" ON "ConsultationTicketHP"("consultationTicketId", "hpId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicketAttribute_consultationTicketId_key" ON "ConsultationTicketAttribute"("consultationTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationNote_consultationTicketId_section_hpId_key" ON "ConsultationNote"("consultationTicketId", "section", "hpId");

-- CreateIndex
CREATE UNIQUE INDEX "PreAssessmentNote_appointmentId_createdBy_key" ON "PreAssessmentNote"("appointmentId", "createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "PreAssessmentNoteAttribute_preAssessmentNoteId_key" ON "PreAssessmentNoteAttribute"("preAssessmentNoteId");

-- CreateIndex
CREATE INDEX "prescription_index" ON "Prescription"("clinicId", "medicationId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Drug_brandName_genericName_key" ON "Drug"("brandName", "genericName");

-- CreateIndex
CREATE INDEX "medication_index" ON "Medication"("patientId", "hpId", "consultationTicketId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userPlanId_fkey" FOREIGN KEY ("userPlanId") REFERENCES "UserPlan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TenantSetting" ADD CONSTRAINT "TenantSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicPatient" ADD CONSTRAINT "ClinicPatient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicPatient" ADD CONSTRAINT "ClinicPatient_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicPatientPermission" ADD CONSTRAINT "ClinicPatientPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicPatientPermission" ADD CONSTRAINT "ClinicPatientPermission_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_defaultHpId_fkey" FOREIGN KEY ("defaultHpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationSetting" ADD CONSTRAINT "OrganizationSetting_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgMemberPermission" ADD CONSTRAINT "OrgMemberPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgMemberPermission" ADD CONSTRAINT "OrgMemberPermission_orgMemberId_fkey" FOREIGN KEY ("orgMemberId") REFERENCES "OrganizationMember"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMemberPermission" ADD CONSTRAINT "ClinicMemberPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMemberPermission" ADD CONSTRAINT "ClinicMemberPermission_clinicMemberId_fkey" FOREIGN KEY ("clinicMemberId") REFERENCES "ClinicMember"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "OrganizationRole"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_clinicRoleId_fkey" FOREIGN KEY ("clinicRoleId") REFERENCES "ClinicRole"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_role_fkey" FOREIGN KEY ("role") REFERENCES "OrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationRole" ADD CONSTRAINT "OrganizationRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HealthcareProvider" ADD CONSTRAINT "HealthcareProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HealthcareProvider" ADD CONSTRAINT "HealthcareProvider_userPlanId_fkey" FOREIGN KEY ("userPlanId") REFERENCES "UserPlan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HealthcareProvider" ADD CONSTRAINT "HealthcareProvider_hpTypeId_fkey" FOREIGN KEY ("hpTypeId") REFERENCES "HealthcareProviderType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HPProfile" ADD CONSTRAINT "HPProfile_healthcareProviderId_fkey" FOREIGN KEY ("healthcareProviderId") REFERENCES "HealthcareProvider"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfessionalDetails" ADD CONSTRAINT "ProfessionalDetails_healthcareProverId_fkey" FOREIGN KEY ("healthcareProverId") REFERENCES "HealthcareProvider"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganization" ADD CONSTRAINT "UserDefaultOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganization" ADD CONSTRAINT "UserDefaultOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganizationRole" ADD CONSTRAINT "UserDefaultOrganizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganizationRole" ADD CONSTRAINT "UserDefaultOrganizationRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "OrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganizationRole" ADD CONSTRAINT "UserDefaultOrganizationRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultClinicRole" ADD CONSTRAINT "UserDefaultClinicRole_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultClinicRole" ADD CONSTRAINT "UserDefaultClinicRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ClinicRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultClinicRole" ADD CONSTRAINT "UserDefaultClinicRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultTenant" ADD CONSTRAINT "UserDefaultTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultTenant" ADD CONSTRAINT "UserDefaultTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ReceiptCodeClaim" ADD CONSTRAINT "ReceiptCodeClaim_receiptCodeId_fkey" FOREIGN KEY ("receiptCodeId") REFERENCES "ReceiptCode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ReceiptCodeClaim" ADD CONSTRAINT "ReceiptCodeClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserMigration" ADD CONSTRAINT "UserMigration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserMigration" ADD CONSTRAINT "UserMigration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FolderSetting" ADD CONSTRAINT "FolderSetting_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FolderSetting" ADD CONSTRAINT "FolderSetting_scopeClinicId_fkey" FOREIGN KEY ("scopeClinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_fileTypeId_fkey" FOREIGN KEY ("fileTypeId") REFERENCES "FileType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FileSetting" ADD CONSTRAINT "FileSetting_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicFileType" ADD CONSTRAINT "ClinicFileType_fileTypeId_fkey" FOREIGN KEY ("fileTypeId") REFERENCES "FileType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicFileType" ADD CONSTRAINT "ClinicFileType_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmergencyContact" ADD CONSTRAINT "UserEmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineAttribute" ADD CONSTRAINT "VaccineAttribute_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineRoute" ADD CONSTRAINT "VaccineRoute_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineRoute" ADD CONSTRAINT "VaccineRoute_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineDose" ADD CONSTRAINT "VaccineDose_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineDose" ADD CONSTRAINT "VaccineDose_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserAllergy" ADD CONSTRAINT "UserAllergy_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "Allergen"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserAllergy" ADD CONSTRAINT "UserAllergy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserHealthCondition" ADD CONSTRAINT "UserHealthCondition_diagnosedBy_fkey" FOREIGN KEY ("diagnosedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserHealthCondition" ADD CONSTRAINT "UserHealthCondition_healthConditionId_fkey" FOREIGN KEY ("healthConditionId") REFERENCES "HealthCondition"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserHealthCondition" ADD CONSTRAINT "UserHealthCondition_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserHealthCondition" ADD CONSTRAINT "UserHealthCondition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDisability" ADD CONSTRAINT "UserDisability_diagnosedBy_fkey" FOREIGN KEY ("diagnosedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDisability" ADD CONSTRAINT "UserDisability_disabilityId_fkey" FOREIGN KEY ("disabilityId") REFERENCES "Disability"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDisability" ADD CONSTRAINT "UserDisability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationDepartment" ADD CONSTRAINT "OrganizationDepartment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationProgram" ADD CONSTRAINT "OrganizationProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationCollege" ADD CONSTRAINT "OrganizationCollege_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationYearLevel" ADD CONSTRAINT "OrganizationYearLevel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "OrganizationCollege"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "OrganizationDepartment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_level_fkey" FOREIGN KEY ("level") REFERENCES "StudentLevel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_programId_fkey" FOREIGN KEY ("programId") REFERENCES "OrganizationProgram"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_userOrganizationRoleId_fkey" FOREIGN KEY ("userOrganizationRoleId") REFERENCES "OrganizationRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_yearLevel_fkey" FOREIGN KEY ("yearLevel") REFERENCES "OrganizationYearLevel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserClinicAppointmentWhitelist" ADD CONSTRAINT "UserClinicAppointmentWhitelist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserClinicAppointmentWhitelist" ADD CONSTRAINT "UserClinicAppointmentWhitelist_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WhitelistFilter" ADD CONSTRAINT "WhitelistFilter_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "Filter"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WhitelistFilter" ADD CONSTRAINT "WhitelistFilter_userClinicAppointmentWhitelistId_fkey" FOREIGN KEY ("userClinicAppointmentWhitelistId") REFERENCES "UserClinicAppointmentWhitelist"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationOffice" ADD CONSTRAINT "OrganizationOffice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "OrganizationCollege"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "OrganizationDepartment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "OrganizationOffice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_userOrganizationRoleId_fkey" FOREIGN KEY ("userOrganizationRoleId") REFERENCES "OrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserSchedule" ADD CONSTRAINT "UserSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ReservedTimeSlot" ADD CONSTRAINT "ReservedTimeSlot_reservedBy_fkey" FOREIGN KEY ("reservedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ReservedTimeSlot" ADD CONSTRAINT "ReservedTimeSlot_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookedBy_fkey" FOREIGN KEY ("bookedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookedFor_fkey" FOREIGN KEY ("bookedFor") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicSetting" ADD CONSTRAINT "ClinicSetting_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ClinicRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicOrganization" ADD CONSTRAINT "ClinicOrganization_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicOrganization" ADD CONSTRAINT "ClinicOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentConfig" ADD CONSTRAINT "AppointmentConfig_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationConfig" ADD CONSTRAINT "ConsultationConfig_noteTemplateId_fkey" FOREIGN KEY ("noteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationConfig" ADD CONSTRAINT "ConsultationConfig_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NoteSection" ADD CONSTRAINT "NoteSection_noteTemplateId_fkey" FOREIGN KEY ("noteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicAppointmentTab" ADD CONSTRAINT "ClinicAppointmentTab_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicAppointmentTab" ADD CONSTRAINT "ClinicAppointmentTab_appointmentTabId_fkey" FOREIGN KEY ("appointmentTabId") REFERENCES "AppointmentTab"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" ADD CONSTRAINT "ClinicRoleAppointmentTab_clinicRoleId_fkey" FOREIGN KEY ("clinicRoleId") REFERENCES "ClinicRole"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" ADD CONSTRAINT "ClinicRoleAppointmentTab_clinicAppointmentTabId_fkey" FOREIGN KEY ("clinicAppointmentTabId") REFERENCES "ClinicAppointmentTab"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttachment" ADD CONSTRAINT "AppointmentAttachment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRequester" ADD CONSTRAINT "AppointmentRequester_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequester" ADD CONSTRAINT "AppointmentRequester_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_modeId_fkey" FOREIGN KEY ("modeId") REFERENCES "AppointmentMode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "AppointmentType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_preferredAppointee_fkey" FOREIGN KEY ("preferredAppointee") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_rescheduledBy_fkey" FOREIGN KEY ("rescheduledBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentType" ADD CONSTRAINT "AppointmentType_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentTypeAttribute" ADD CONSTRAINT "AppointmentTypeAttribute_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentMode" ADD CONSTRAINT "AppointmentMode_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_routedBy_fkey" FOREIGN KEY ("routedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_routedTo_fkey" FOREIGN KEY ("routedTo") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_amendedBy_fkey" FOREIGN KEY ("amendedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ServiceAttribute" ADD CONSTRAINT "ServiceAttribute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketHP" ADD CONSTRAINT "ConsultationTicketHP_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketHP" ADD CONSTRAINT "ConsultationTicketHP_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketAttribute" ADD CONSTRAINT "ConsultationTicketAttribute_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketAttribute" ADD CONSTRAINT "ConsultationTicketAttribute_noteTemplateId_fkey" FOREIGN KEY ("noteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "System" ADD CONSTRAINT "System_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PreAssessmentNote" ADD CONSTRAINT "PreAssessmentNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PreAssessmentNote" ADD CONSTRAINT "PreAssessmentNote_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PreAssessmentNote" ADD CONSTRAINT "PreAssessmentNote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PreAssessmentNoteAttribute" ADD CONSTRAINT "PreAssessmentNoteAttribute_preAssessmentNoteId_fkey" FOREIGN KEY ("preAssessmentNoteId") REFERENCES "PreAssessmentNote"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MedicationDrug" ADD CONSTRAINT "MedicationDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MedicationDrug" ADD CONSTRAINT "MedicationDrug_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_type_fkey" FOREIGN KEY ("type") REFERENCES "DocumentTemplateType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicPrescriptionSetting" ADD CONSTRAINT "ClinicPrescriptionSetting_prescriptionTemplateId_fkey" FOREIGN KEY ("prescriptionTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicPrescriptionSetting" ADD CONSTRAINT "ClinicPrescriptionSetting_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
