
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.17.0
 * Query Engine version: 393aa359c9ad4a4bb28630fb5613f9c281cde053
 */
Prisma.prismaVersion = {
  client: "5.17.0",
  engine: "393aa359c9ad4a4bb28630fb5613f9c281cde053"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  ownerId: 'ownerId',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.TenantSettingScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  onPremise: 'onPremise',
  storageConnectionString: 'storageConnectionString',
  dbConnectionString: 'dbConnectionString'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  email: 'email',
  picture: 'picture',
  createdAt: 'createdAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  updatedAt: 'updatedAt',
  bloodType: 'bloodType',
  civilStatus: 'civilStatus',
  dob: 'dob',
  firstName: 'firstName',
  gender: 'gender',
  lastName: 'lastName',
  middleName: 'middleName',
  mobile: 'mobile',
  nationality: 'nationality',
  nickname: 'nickname',
  religion: 'religion',
  suffix: 'suffix',
  telephone: 'telephone'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  orgId: 'orgId',
  name: 'name',
  description: 'description',
  picture: 'picture',
  cover: 'cover',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  customUrl: 'customUrl',
  email: 'email'
};

exports.Prisma.OrganizationSettingScalarFieldEnum = {
  id: 'id',
  orgId: 'orgId',
  isPublic: 'isPublic',
  sendEmailNotification: 'sendEmailNotification',
  emailToOrgOnly: 'emailToOrgOnly'
};

exports.Prisma.UserOrganizationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  organizationId: 'organizationId',
  acceptedAt: 'acceptedAt',
  acceptedBy: 'acceptedBy',
  createdAt: 'createdAt',
  status: 'status',
  role: 'role'
};

exports.Prisma.UserOrganizationRoleScalarFieldEnum = {
  id: 'id',
  orgId: 'orgId',
  name: 'name',
  description: 'description',
  requirements: 'requirements',
  isActive: 'isActive'
};

exports.Prisma.PlanScalarFieldEnum = {
  id: 'id',
  planUid: 'planUid',
  price: 'price',
  name: 'name',
  type: 'type',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.FeatureScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  planId: 'planId'
};

exports.Prisma.UserPlanScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  planId: 'planId',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  status: 'status'
};

exports.Prisma.HealthcareProviderScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  isPublished: 'isPublished'
};

exports.Prisma.DoctorProfileScalarFieldEnum = {
  id: 'id',
  healthcareProviderId: 'healthcareProviderId',
  title: 'title',
  name: 'name',
  suffix: 'suffix',
  picture: 'picture',
  cover: 'cover',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  affiliations: 'affiliations',
  areaOfInterest: 'areaOfInterest',
  certifications: 'certifications',
  experience: 'experience',
  fields: 'fields',
  hobbies: 'hobbies',
  languages: 'languages',
  philosophy: 'philosophy',
  specialties: 'specialties',
  workEmail: 'workEmail',
  workPhone: 'workPhone',
  educations: 'educations'
};

exports.Prisma.NurseProfileScalarFieldEnum = {
  id: 'id',
  healthcareProviderId: 'healthcareProviderId',
  title: 'title',
  name: 'name',
  suffix: 'suffix',
  picture: 'picture',
  cover: 'cover',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  affiliations: 'affiliations',
  areaOfInterest: 'areaOfInterest',
  certifications: 'certifications',
  experience: 'experience',
  fields: 'fields',
  hobbies: 'hobbies',
  languages: 'languages',
  philosophy: 'philosophy',
  specialties: 'specialties',
  workEmail: 'workEmail',
  workPhone: 'workPhone',
  educations: 'educations'
};

exports.Prisma.ProfessionalDetailsScalarFieldEnum = {
  id: 'id',
  healthcareProverId: 'healthcareProverId',
  licenseNumber: 'licenseNumber',
  licenseIssued: 'licenseIssued',
  licenseExpires: 'licenseExpires',
  ptrNumber: 'ptrNumber',
  taxNumber: 'taxNumber'
};

exports.Prisma.UserDefaultOrganizationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  organizationId: 'organizationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.UserDefaultOrganizationRoleScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  organizationId: 'organizationId',
  roleId: 'roleId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.UserDefaultTenantScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.SocialLinkScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  facebook: 'facebook',
  instagram: 'instagram',
  linkedin: 'linkedin',
  tiktok: 'tiktok',
  twitter: 'twitter',
  website: 'website'
};

exports.Prisma.ReceiptCodeScalarFieldEnum = {
  id: 'id',
  coverage: 'coverage',
  code: 'code',
  amount: 'amount',
  status: 'status',
  maxUses: 'maxUses',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.ReceiptCodeClaimScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  receiptCodeId: 'receiptCodeId'
};

exports.Prisma.UserMigrationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  orgId: 'orgId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.ActivationCodeScalarFieldEnum = {
  id: 'id',
  code: 'code',
  userId: 'userId',
  expiresAt: 'expiresAt',
  isUsed: 'isUsed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.FolderScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.FolderSettingScalarFieldEnum = {
  id: 'id',
  folderId: 'folderId',
  scopeOrgId: 'scopeOrgId',
  isPublic: 'isPublic'
};

exports.Prisma.FileScalarFieldEnum = {
  id: 'id',
  folderId: 'folderId',
  fileTypeId: 'fileTypeId',
  name: 'name',
  size: 'size',
  url: 'url',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  dateTaken: 'dateTaken'
};

exports.Prisma.FileSettingScalarFieldEnum = {
  id: 'id',
  fileId: 'fileId',
  isPublic: 'isPublic'
};

exports.Prisma.FileTypeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.FileTypeAttributeScalarFieldEnum = {
  id: 'id',
  fileTypeId: 'fileTypeId',
  required: 'required',
  dateTakenRequired: 'dateTakenRequired',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  scopeOrgId: 'scopeOrgId',
  validUntil: 'validUntil'
};

exports.Prisma.UserEmergencyContactScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  isPrimary: 'isPrimary',
  name: 'name',
  relationship: 'relationship',
  phone: 'phone',
  address: 'address',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.UserAddressScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  isPrimary: 'isPrimary',
  address: 'address',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  country: 'country',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.VaccineScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  type: 'type'
};

exports.Prisma.VaccineAttributeScalarFieldEnum = {
  id: 'id',
  vaccineId: 'vaccineId',
  effectivity: 'effectivity'
};

exports.Prisma.RouteScalarFieldEnum = {
  id: 'id',
  route: 'route',
  description: 'description',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.DoseScalarFieldEnum = {
  id: 'id',
  dose: 'dose',
  description: 'description',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.VaccineRouteScalarFieldEnum = {
  id: 'id',
  vaccineId: 'vaccineId',
  routeId: 'routeId'
};

exports.Prisma.VaccineDoseScalarFieldEnum = {
  id: 'id',
  vaccineId: 'vaccineId',
  doseId: 'doseId'
};

exports.Prisma.UserVaccinationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  vaccineId: 'vaccineId',
  doseId: 'doseId',
  routeId: 'routeId',
  dateGiven: 'dateGiven',
  notes: 'notes',
  administeredBy: 'administeredBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.AllergenScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.UserAllergyScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  reaction: 'reaction',
  notes: 'notes',
  allergenId: 'allergenId'
};

exports.Prisma.HealthConditionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.UserHealthConditionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  healthConditionId: 'healthConditionId',
  dateDiagnosed: 'dateDiagnosed',
  severity: 'severity',
  notes: 'notes',
  dateResolved: 'dateResolved',
  diagnosedBy: 'diagnosedBy',
  resolvedBy: 'resolvedBy',
  status: 'status'
};

exports.Prisma.DisabilityScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.UserDisabilityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  disabilityId: 'disabilityId',
  dateDiagnosed: 'dateDiagnosed',
  severity: 'severity',
  notes: 'notes',
  isManaged: 'isManaged',
  reason: 'reason',
  diagnosedBy: 'diagnosedBy'
};

exports.Prisma.VitalSignScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  dateTaken: 'dateTaken',
  height: 'height',
  weight: 'weight',
  bmi: 'bmi',
  bpSystolic: 'bpSystolic',
  bpDiastolic: 'bpDiastolic',
  pulseRate: 'pulseRate',
  temp: 'temp',
  spo2: 'spo2',
  respRate: 'respRate',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.OrganizationDepartmentScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.OrganizationProgramScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.OrganizationCollegeScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.StudentLevelScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.OrgYearLevelScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.UserStudentRecordScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  organizationId: 'organizationId',
  studentId: 'studentId',
  lrn: 'lrn',
  level: 'level',
  yearLevel: 'yearLevel',
  programId: 'programId',
  departmentId: 'departmentId',
  collegeId: 'collegeId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  userOrganizationRoleId: 'userOrganizationRoleId'
};

exports.Prisma.OrganizationOfficeScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.UserEmploymentRecordScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  organizationId: 'organizationId',
  employeeId: 'employeeId',
  position: 'position',
  designation: 'designation',
  departmentId: 'departmentId',
  officeId: 'officeId',
  collegeId: 'collegeId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive',
  userOrganizationRoleId: 'userOrganizationRoleId'
};

exports.Prisma.OrganizationServiceScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  category: 'category',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.OrganizationServiceCategoryScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  isActive: 'isActive'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.BloodType = exports.$Enums.BloodType = {
  A_POSITIVE: 'A_POSITIVE',
  A_NEGATIVE: 'A_NEGATIVE',
  B_POSITIVE: 'B_POSITIVE',
  B_NEGATIVE: 'B_NEGATIVE',
  AB_POSITIVE: 'AB_POSITIVE',
  AB_NEGATIVE: 'AB_NEGATIVE',
  O_POSITIVE: 'O_POSITIVE',
  O_NEGATIVE: 'O_NEGATIVE',
  RH_POSITIVE: 'RH_POSITIVE',
  RH_NEGATIVE: 'RH_NEGATIVE',
  UNKNOWN: 'UNKNOWN'
};

exports.CivilStatus = exports.$Enums.CivilStatus = {
  SINGLE: 'SINGLE',
  MARRIED: 'MARRIED',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
  SEPARATED: 'SEPARATED'
};

exports.Gender = exports.$Enums.Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE'
};

exports.UserOrganizationStatus = exports.$Enums.UserOrganizationStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED'
};

exports.PlanType = exports.$Enums.PlanType = {
  TENANT: 'TENANT',
  HEALTHCARE_PROVIDER: 'HEALTHCARE_PROVIDER'
};

exports.UserPlanStatus = exports.$Enums.UserPlanStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  PENDING: 'PENDING'
};

exports.HealthcareProviderType = exports.$Enums.HealthcareProviderType = {
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  PHARMACIST: 'PHARMACIST',
  RADIOLOGIST: 'RADIOLOGIST',
  PHYSIOTHERAPIST: 'PHYSIOTHERAPIST',
  OCCUPATIONAL_THERAPIST: 'OCCUPATIONAL_THERAPIST',
  SPEECH_THERAPIST: 'SPEECH_THERAPIST',
  DIETITIAN: 'DIETITIAN',
  SOCIAL_WORKER: 'SOCIAL_WORKER',
  PSYCHOLOGIST: 'PSYCHOLOGIST',
  PSYCHIATRIST: 'PSYCHIATRIST',
  DENTIST: 'DENTIST',
  OPTOMETRIST: 'OPTOMETRIST',
  CHIROPRACTOR: 'CHIROPRACTOR',
  PODIATRIST: 'PODIATRIST'
};

exports.Coverage = exports.$Enums.Coverage = {
  ALL: 'ALL',
  TENANT: 'TENANT',
  HEALTHCARE_PROVIDER: 'HEALTHCARE_PROVIDER'
};

exports.ReceiptCodeStatus = exports.$Enums.ReceiptCodeStatus = {
  UNUSED: 'UNUSED',
  USED: 'USED',
  EXPIRED: 'EXPIRED'
};

exports.Severity = exports.$Enums.Severity = {
  MILD: 'MILD',
  MODERATE: 'MODERATE',
  SEVERE: 'SEVERE',
  CRITICAL: 'CRITICAL',
  PROFOUND: 'PROFOUND',
  UNKNOWN: 'UNKNOWN'
};

exports.HealthConditionStatus = exports.$Enums.HealthConditionStatus = {
  RESOLVED: 'RESOLVED',
  UNRESOLVED: 'UNRESOLVED'
};

exports.Prisma.ModelName = {
  Tenant: 'Tenant',
  TenantSetting: 'TenantSetting',
  User: 'User',
  Organization: 'Organization',
  OrganizationSetting: 'OrganizationSetting',
  UserOrganization: 'UserOrganization',
  UserOrganizationRole: 'UserOrganizationRole',
  Plan: 'Plan',
  Feature: 'Feature',
  UserPlan: 'UserPlan',
  HealthcareProvider: 'HealthcareProvider',
  DoctorProfile: 'DoctorProfile',
  NurseProfile: 'NurseProfile',
  ProfessionalDetails: 'ProfessionalDetails',
  UserDefaultOrganization: 'UserDefaultOrganization',
  UserDefaultOrganizationRole: 'UserDefaultOrganizationRole',
  UserDefaultTenant: 'UserDefaultTenant',
  SocialLink: 'SocialLink',
  ReceiptCode: 'ReceiptCode',
  ReceiptCodeClaim: 'ReceiptCodeClaim',
  UserMigration: 'UserMigration',
  ActivationCode: 'ActivationCode',
  Folder: 'Folder',
  FolderSetting: 'FolderSetting',
  File: 'File',
  FileSetting: 'FileSetting',
  FileType: 'FileType',
  FileTypeAttribute: 'FileTypeAttribute',
  UserEmergencyContact: 'UserEmergencyContact',
  UserAddress: 'UserAddress',
  Vaccine: 'Vaccine',
  VaccineAttribute: 'VaccineAttribute',
  Route: 'Route',
  Dose: 'Dose',
  VaccineRoute: 'VaccineRoute',
  VaccineDose: 'VaccineDose',
  UserVaccination: 'UserVaccination',
  Allergen: 'Allergen',
  UserAllergy: 'UserAllergy',
  HealthCondition: 'HealthCondition',
  UserHealthCondition: 'UserHealthCondition',
  Disability: 'Disability',
  UserDisability: 'UserDisability',
  VitalSign: 'VitalSign',
  OrganizationDepartment: 'OrganizationDepartment',
  OrganizationProgram: 'OrganizationProgram',
  OrganizationCollege: 'OrganizationCollege',
  StudentLevel: 'StudentLevel',
  OrgYearLevel: 'OrgYearLevel',
  UserStudentRecord: 'UserStudentRecord',
  OrganizationOffice: 'OrganizationOffice',
  UserEmploymentRecord: 'UserEmploymentRecord',
  OrganizationService: 'OrganizationService',
  OrganizationServiceCategory: 'OrganizationServiceCategory'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
