import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
// import * as nodemailer from 'nodemailer';


type CC = Awaited<ReturnType<typeof clerkClient>>;

const prisma = new PrismaClient();

interface FreshmenData {
  // Metadata
  timestamp: number; // Excel serial date number

  // contact info
  email_address: string;
  personal_contact_number: number;

  // personal info
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  sex: string;
  religion: string;
  nationality: string;
  civil_status: string;
  date_of_birth: string;

  // Address fields
  specific_address: string;
  city_municipality: string;
  zip_code: number;
  province: string;
  barangay: string;

  // Emergency Contact fields
  relationship: string;
  first_name_1: string;
  middle_name_1: string | null;
  last_name_1: string;
  contact_number: number | null;
  address_1: string | null;

  // Student Record
  student_id_no_: number;
  year_level: string;

  // Medical Files (Google Drive URLs)
  'Vaccination Card': string | null;
  'Chest X-ray': string | null;
  'Medical Certificate': string | null;
}

// Type the imported JSON data
interface FreshmenJsonData {
  "Form Responses 1": FreshmenData[];
}

// Original full dataset
const freshenData: FreshmenJsonData = require('./data/Freshmen_Screening_2023_ACCURATE.json');

// IMPORTING: Sanitized failed users with corrected email addresses
// const freshenData: FreshmenJsonData = require('../prisma/data/Freshmen_Screening_2023_FAILED_USERS_SANITIZED.json');

const seeds: FreshmenData[] = freshenData["Form Responses 1"];

function cleanDataQualityIssues(data: FreshmenData[]): FreshmenData[] {
  return data.map(record => {
    const cleaned = { ...record };

    const optionalStringFields: (keyof FreshmenData)[] = [
      'middle_name',
      'suffix',
      'middle_name_1',
      'address_1',
    ];

    optionalStringFields.forEach(field => {
      if (cleaned[field] === null || cleaned[field] === undefined) {
        (cleaned as any)[field] = '';
      }
    });

    return cleaned;
  });
}

const cleanedSeeds = cleanDataQualityIssues(seeds);

// Process all users
const testMode = false;
const START_INDEX = 0;
const END_INDEX = cleanedSeeds.length;
const seedsToProcess = cleanedSeeds.slice(START_INDEX, END_INDEX);

// Batch processing configuration
const BATCH_SIZE = 5;  // Reduced from 10 to 5 to avoid rate limits
const BATCH_DELAY_MS = 15000;  // Increased to 15 seconds between batches
const PER_USER_DELAY_MS = 1000;  // 1 second delay between each user creation
const MAX_NEW_USERS_PER_RUN = 80;  // Maximum NEW users to create per run (to avoid rate limits)

// User credential tracking
interface UserCredential {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  errorMessage?: string;
}

const userCredentials: UserCredential[] = [];

// Clerk error type definitions
interface ClerkAPIError {
  code: string;
  message: string;
  longMessage?: string;
  meta?: Record<string, unknown>;
}

interface ClerkError extends Error {
  status?: number;
  clerkError?: boolean;
  errors?: ClerkAPIError[];
}

// Type guard to check if error is a Clerk error with status code
function isClerkErrorWithStatus(error: unknown): error is ClerkError & { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as ClerkError).status === 'number'
  );
}

// Type guard to check if error has Clerk API errors array
function hasClerkErrors(error: unknown): error is ClerkError & { errors: ClerkAPIError[] } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as ClerkError).errors)
  );
}


async function processUsersInBatches({ count, fileType, client, seed }: {
  count: {
    skippedCount: number;
    failedCount: number;
    outputPath: string;
    successCount: number;
    studentsWithFiles: number;
    totalFilesAvailable: number;
    newUsersCreatedThisRun: number;
  }, fileType: {
    vaccinationCardType: { id: number } | null;
    xRayType: { id: number } | null;
    medicalCertType: { id: number } | null;
  }, client: CC, seed: FreshmenData
}) {

  try {
    // transaction
    await prisma.$transaction(async (prisma) => {
      // Generate a valid username (only letters, numbers, -, _)
      const username = seed.email_address.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
      const password = createStrongPassword();
      const createdAt = excelSerialToDate(seed.timestamp);

      // non-incrementing destructure
      const { outputPath } = count;

      // destructure fileType
      const { vaccinationCardType, xRayType, medicalCertType } = fileType;

      // Check if user already exists in Clerk
      let clerkUser;
      try {
        const existingUsers = await client.users.getUserList({
          emailAddress: [seed.email_address]
        });

        if (existingUsers.data.length > 0) {
          console.log(`[SKIP] Existing user: ${seed.email_address}`);
          count.skippedCount++;
          userCredentials.push({
            email: seed.email_address,
            password: 'N/A (Already exists)',
            firstName: seed.first_name,
            lastName: seed.last_name,
            createdAt: createdAt.toISOString(),
            status: 'SKIPPED'
          });
          // Update Excel file immediately
          updateCredentialsExcel(userCredentials, outputPath);
          return;
        }

        await delay(PER_USER_DELAY_MS); // Delay between user creations

        // Create Clerk user and IMMEDIATELY capture credentials
        clerkUser = await client.users.createUser({
          firstName: seed.first_name,
          lastName: seed.last_name,
          emailAddress: [seed.email_address],
          username,
          password,

          privateMetadata: {
            requiresPasswordChange: true,
          },
        });

        // IMMEDIATELY store credentials after successful Clerk creation
        console.log(`[SUCCESS] Created Clerk user: ${seed.email_address}`);

        // Increment NEW user counter
        count.newUsersCreatedThisRun++;

        // Store credentials right away - password is only available now!
        userCredentials.push({
          email: seed.email_address,
          password: password, // Capture the actual password immediately
          firstName: seed.first_name,
          lastName: seed.last_name,
          createdAt: createdAt.toISOString(),
          status: 'SUCCESS'
        });

        // Update Excel file IMMEDIATELY after successful creation
        updateCredentialsExcel(userCredentials, outputPath);

      } catch (error: unknown) {
        // Check for existing user error
        if (hasClerkErrors(error) && error.errors.some((e) => e.code === 'form_identifier_exists')) {
          console.log(`[SKIP] Existing Clerk user: ${seed.email_address}`);
          count.skippedCount++;
          userCredentials.push({
            email: seed.email_address,
            password: 'N/A (Already exists)',
            firstName: seed.first_name,
            lastName: seed.last_name,
            createdAt: createdAt.toISOString(),
            status: 'SKIPPED'
          });
          // Update Excel file immediately
          updateCredentialsExcel(userCredentials, outputPath);
          return;
        }

        // Enhanced error logging for debugging
        console.error(`\n${'='.repeat(80)}`);
        console.error(`[ERROR] Failed to create Clerk user: ${seed.email_address}`);
        console.error(`${'='.repeat(80)}`);
        console.error('Full error object:', JSON.stringify(error, null, 2));

        if (hasClerkErrors(error)) {
          console.error('\nClerk API Errors:');
          error.errors.forEach((err, index) => {
            console.error(`  ${index + 1}. Code: ${err.code}`);
            console.error(`     Message: ${err.message}`);
            if (err.longMessage) console.error(`     Long Message: ${err.longMessage}`);
            if (err.meta) console.error(`     Meta:`, err.meta);
          });
        }

        if (isClerkErrorWithStatus(error)) {
          console.error(`\nHTTP Status Code: ${error.status}`);
        }

        console.error(`${'='.repeat(80)}\n`);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        count.failedCount++;
        userCredentials.push({
          email: seed.email_address,
          password: 'N/A (Failed)',
          firstName: seed.first_name,
          lastName: seed.last_name,
          createdAt: createdAt.toISOString(),
          status: 'FAILED',
          errorMessage: errorMessage
        });
        // Update Excel file immediately even for failures
        updateCredentialsExcel(userCredentials, outputPath);
        return;
      }

      if (!clerkUser) {
        console.error(`[ERROR] Failed to create clerk user: ${seed.email_address}`);
        count.failedCount++;
        userCredentials.push({
          email: seed.email_address,
          password: 'N/A (Failed)',
          firstName: seed.first_name,
          lastName: seed.last_name,
          createdAt: createdAt.toISOString(),
          status: 'FAILED',
          errorMessage: 'Failed to create Clerk user'
        });
        return;
      }

      const yearLevel = await prisma.userStudentRecord.findFirst({
        where: {
          OrganizationYearLevel: {
            name: seed.year_level,
          }
        },
        select: {
          id: true,
          organizationId: true,
        }
      })

      const level = await prisma.studentLevel.findFirst({
        where: {
          name: "Tertiary",
        },
        select: {
          id: true,
        }
      })

      // search of a user by email
      const acceptedBy = await prisma.user.findFirst({
        where: {
          email: 'clinicez.official@gmail.com',
        },
        select: {
          id: true,
        }
      })

      const userId = await prisma.user.upsert({
        where: {
          email: seed.email_address,
        },
        update: {
          // email: seed.email_address,
          firstName: seed.first_name,
          middleName: seed.middle_name,
          lastName: seed.last_name,
          userId: clerkUser.id,
          religion: seed.religion,
          gender: seed.sex.toUpperCase() as 'MALE' | 'FEMALE',
          nationality: seed.nationality,
          civilStatus: seed.civil_status.toUpperCase() as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED',
          dob: new Date(seed.date_of_birth),
          suffix: seed.suffix,
          mobile: seed.personal_contact_number.toString(),
          isActive: true,
          createdAt: createdAt,
          updatedAt: new Date(),

          // Address
          UserAddresses: {
            create: {
              address: seed.specific_address,
              city: seed.city_municipality,
              country: "Philippines",
              zipCode: seed.zip_code.toString(),
              isPrimary: true,
              state: seed.province,
              barangay: seed.barangay.toString(),
              isActive: true,
              createdAt: createdAt,
            }
          },

          // Emergency Contact
          UserEmergencyContacts: {
            create: {
              name: `${seed.first_name_1} ${seed.middle_name_1 ? seed.middle_name_1 + ' ' : ''}${seed.last_name_1}`,
              relationship: seed.relationship,
              phone: seed.contact_number ? seed.contact_number.toString() : '',
              firstName: seed.first_name_1,
              middleName: seed.middle_name_1,
              lastName: seed.last_name_1,
              address: seed.address_1,
              isActive: true,
              createdAt: createdAt,
            },
          },

          // Organization Member
          // OrganizationMembers: {
          //   upsert: {
          //     where: {
          //       unique_user_organization_role: {
          //         userId: userId,
          //         organizationId: 1,
          //         role: 2,
          //       }
          //     },
          //     create: {
          //       organizationId: 1,
          //       role: 2,
          //       acceptedBy: acceptedBy ? acceptedBy.id : undefined,
          //       acceptedAt: new Date(),
          //       status: "ACTIVE",
          //       createdAt: createdAt,
          //     },
          //     update: {
          //       organizationId: 1,
          //       role: 2,
          //       acceptedBy: acceptedBy ? acceptedBy.id : undefined,
          //       acceptedAt: new Date(),
          //       status: "ACTIVE",
          //       createdAt: createdAt,
          //     }
          //   }
          // },

          // Student Record
          // StudentRecords: yearLevel && level ? {
          //   create: {
          //     studentId: seed.student_id_no_.toString(),
          //     yearLevel: yearLevel.id,
          //     organizationId: yearLevel.organizationId,
          //     level: level.id,
          //     isActive: true,
          //     createdAt: createdAt,
          //   }
          // } : undefined,
        },
        create: {
          email: seed.email_address,
          firstName: seed.first_name,
          middleName: seed.middle_name,
          lastName: seed.last_name,
          userId: clerkUser.id,
          religion: seed.religion,
          gender: seed.sex.toUpperCase() as 'MALE' | 'FEMALE',
          nationality: seed.nationality,
          civilStatus: seed.civil_status.toUpperCase() as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED',
          dob: new Date(seed.date_of_birth),
          suffix: seed.suffix,
          mobile: seed.personal_contact_number.toString(),
          isActive: true,
          createdAt: createdAt,
          // updatedAt: new Date(),

          // Address
          UserAddresses: {
            create: {
              address: seed.specific_address,
              city: seed.city_municipality,
              country: "Philippines",
              zipCode: seed.zip_code.toString(),
              isPrimary: true,
              state: seed.province,
              barangay: seed.barangay.toString(),
              isActive: true,
              createdAt: createdAt,
            }
          },

          // Emergency Contact
          UserEmergencyContacts: {
            create: {
              name: `${seed.first_name_1} ${seed.middle_name_1 ? seed.middle_name_1 + ' ' : ''}${seed.last_name_1}`,
              relationship: seed.relationship,
              phone: seed.contact_number ? seed.contact_number.toString() : '',
              firstName: seed.first_name_1,
              middleName: seed.middle_name_1,
              lastName: seed.last_name_1,
              address: seed.address_1,
              isActive: true,
              createdAt: createdAt,
            },
          },

          // Organization Member
          // OrganizationMembers: {
          //   create: {
          //     organizationId: 1,
          //     role: 2,
          //     acceptedBy: acceptedBy ? acceptedBy.id : undefined,
          //     acceptedAt: new Date(),
          //     status: "ACTIVE",
          //     createdAt: createdAt,
          //   }
          // },

          // Student Record
          // StudentRecords: yearLevel && level ? {
          //   create: {
          //     studentId: seed.student_id_no_.toString(),
          //     yearLevel: yearLevel.id,
          //     organizationId: yearLevel.organizationId,
          //     level: level.id,
          //     isActive: true,
          //     createdAt: createdAt,
          //   }
          // } : undefined,
        }, select: {
          id: true
        }
      })

      if (!userId) {
        console.error(`[ERROR] Failed to create database user: ${seed.email_address}`);
        count.failedCount++;
        // Update the existing credential entry to FAILED status
        const credentialIndex = userCredentials.findIndex(c => c.email === seed.email_address);
        if (credentialIndex !== -1) {
          userCredentials[credentialIndex].status = 'FAILED';
          userCredentials[credentialIndex].errorMessage = 'Failed to create user in database';
        }
        return;
      }

      const organizationMember = await prisma.organizationMember.upsert({
        where: {
          unique_user_organization_role: {
            userId: userId.id,
            organizationId: 1,
            role: 2,
          }
        },
        create: {
          userId: userId.id,
          organizationId: 1,
          role: 2,
          acceptedBy: acceptedBy ? acceptedBy.id : undefined,
          acceptedAt: new Date(),
          status: "ACTIVE",
          createdAt: createdAt,
        },
        update: {
          organizationId: 1,
          role: 2,
          acceptedBy: acceptedBy ? acceptedBy.id : undefined,
          acceptedAt: new Date(),
          status: "ACTIVE",
          createdAt: createdAt,
        },
        select: {
          organizationId: true,
        }
      })

      if (yearLevel && level) {
        await prisma.userStudentRecord.upsert({
          where: {
            unique_user_student_record: {
              userId: userId.id,
              organizationId: organizationMember.organizationId,
            }
          },
          update: {
            studentId: seed.student_id_no_.toString(),
            yearLevel: yearLevel.id,
            organizationId: yearLevel.organizationId,
            level: level.id,
            isActive: true,
            createdAt: createdAt,
          },
          create: {
            userId: userId.id,
            studentId: seed.student_id_no_.toString(),
            yearLevel: yearLevel.id,
            organizationId: yearLevel.organizationId,
            level: level.id,
            isActive: true,
            createdAt: createdAt,
          }
        })
      }

      count.successCount++;
      console.log(`[SUCCESS] Created database user: ${seed.email_address}`);

      // Check if student has any medical files in Google Drive
      const hasVaccinationCard = seed['Vaccination Card'] && seed['Vaccination Card'].trim().length > 0;
      const hasXRay = seed['Chest X-ray'] && seed['Chest X-ray'].trim().length > 0;
      const hasMedicalCert = seed['Medical Certificate'] && seed['Medical Certificate'].trim().length > 0;

      if (hasVaccinationCard || hasXRay || hasMedicalCert) {
        count.studentsWithFiles++;

        // Count total files
        if (hasVaccinationCard) count.totalFilesAvailable++;
        if (hasXRay) count.totalFilesAvailable++;
        if (hasMedicalCert) count.totalFilesAvailable++;

        // Create "Medical Records" folder with File records pointing to Google Drive URLs
        // Files will use Google Drive URLs directly until they can be migrated to Azure Blob
        if (vaccinationCardType && xRayType && medicalCertType) {
          const medicalFolder = await prisma.folder.upsert({
            where: {
              unique_user_folder: {
                userId: userId.id,
                name: "Medical Records",
              },
            },
            create: {
              name: "Medical Records",
              userId: userId.id,
              isActive: true,
              createdAt: createdAt,
              FolderSetting: {
                create: {
                  isPublic: true,
                }
              }
            },
            update: {}
          });

          // Create File records for each available medical file with Google Drive URLs
          const fileCreationPromises = [];

          if (hasVaccinationCard) {
            fileCreationPromises.push(
              prisma.file.create({
                data: {
                  name: `Vaccination_Card_${Date.now()}`,
                  url: seed['Vaccination Card']!,
                  folderId: medicalFolder.id,
                  fileTypeId: vaccinationCardType.id,
                  size: 0, // Size unknown for Google Drive URLs
                  createdAt: createdAt,
                  FileSetting: {
                    create: {
                      isPublic: true,
                    }
                  }
                }
              })
            );
          }

          if (hasXRay) {
            fileCreationPromises.push(
              prisma.file.create({
                data: {
                  name: `Chest_X-ray_${Date.now()}`,
                  url: seed['Chest X-ray']!,
                  folderId: medicalFolder.id,
                  fileTypeId: xRayType.id,
                  size: 0, // Size unknown for Google Drive URLs
                  createdAt: createdAt,
                  FileSetting: {
                    create: {
                      isPublic: true,
                    }
                  }
                }
              })
            );
          }

          if (hasMedicalCert) {
            fileCreationPromises.push(
              prisma.file.create({
                data: {
                  name: `Medical_Certificate_${Date.now()}`,
                  url: seed['Medical Certificate']!,
                  folderId: medicalFolder.id,
                  fileTypeId: medicalCertType.id,
                  size: 0, // Size unknown for Google Drive URLs
                  createdAt: createdAt,
                  FileSetting: {
                    create: {
                      isPublic: true,
                    }
                  }
                }
              })
            );
          }

          await Promise.all(fileCreationPromises);
        }
      }

      // More seeding here if needed

      // Send email to the user to login
      // await sendWelcomeEmail(transporter, seed.email_address, seed.first_name, seed.last_name, password);

      // Add delay between each user creation to avoid rate limiting
      await delay(PER_USER_DELAY_MS);
    }, {
      timeout: 300000, // 5 minutes
      isolationLevel: 'Serializable',
      maxWait: 10000, // 10 seconds
    });
  } catch (error) {
    console.error(`[ERROR] Unexpected error processing user ${seed.email_address}:`, error);
    // Check for rate limit error (429 status code)
    if (isClerkErrorWithStatus(error) && error.status === 429) {
      console.log(`[RATE LIMIT] Hit rate limit while processing ${seed.email_address}. Waiting before retrying...`);
      await delay(BATCH_DELAY_MS);
      // call the function again to retry
      await processUsersInBatches({ count, fileType, client, seed });
    }
  }
}

// Helper function to convert Excel serial date to JavaScript Date
// Excel stores dates as numbers (days since January 1, 1900)
function excelSerialToDate(serial: number): Date {
  // Excel incorrectly considers 1900 as a leap year, so we need to account for that
  // Excel epoch is December 30, 1899 (not January 1, 1900)
  const excelEpoch = new Date(1899, 11, 30);
  const days = Math.floor(serial);
  const milliseconds = Math.round((serial - days) * 86400000);

  const date = new Date(excelEpoch.getTime() + days * 86400000 + milliseconds);
  return date;
}

// Helper function for batch delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate Excel file
const generateCredentialsExcel = (credentials: UserCredential[], outputPath: string): void => {
  const worksheetData = [
    ['Email', 'Temporary Password', 'First Name', 'Last Name', 'Created At', 'Status', 'Error Message'],
    ...credentials.map(cred => [
      cred.email,
      cred.password,
      cred.firstName,
      cred.lastName,
      cred.createdAt,
      cred.status,
      cred.errorMessage || ''
    ])
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 35 }, // Email
    { wch: 20 }, // Password
    { wch: 20 }, // First Name
    { wch: 20 }, // Last Name
    { wch: 25 }, // Created At
    { wch: 12 }, // Status
    { wch: 50 }, // Error Message
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'User Credentials');
  XLSX.writeFile(workbook, outputPath);
};

// Helper function to append/update Excel file immediately after each user creation
const updateCredentialsExcel = (credentials: UserCredential[], outputPath: string): void => {
  try {
    generateCredentialsExcel(credentials, outputPath);
  } catch (error) {
    console.error(`[ERROR] Failed to update Excel file: ${error}`);
  }
};

console.log('[DATA QUALITY REPORT]');
console.log(`Total records from Excel source: ${seeds.length}`);
console.log(`Using ACCURATE JSON - faithfully extracted from Excel`);
console.log(`   - Excel (source of truth): 4,323 records`);
console.log(`   - Previous Normalized JSON had 490 character corruptions`);
console.log(`   - Example fixes: "Iponull" -> "Iponan", "johnulldre" -> "johnandre"`);
console.log(`   - Accurate JSON: Only 2 legitimate "null" strings (in URLs/emails)`);
console.log(`   - Timestamps: Using Excel timestamps for createdAt dates`);
console.log(`\n[TEST MODE] Processing first ${seedsToProcess.length} records only`);
console.log(`[BATCH CONFIG] ${BATCH_SIZE} users per batch, ${BATCH_DELAY_MS}ms batch delay, ${PER_USER_DELAY_MS}ms per-user delay`);
const totalBatches = Math.ceil(seedsToProcess.length / BATCH_SIZE);
const batchDelayTime = totalBatches * (BATCH_DELAY_MS / 1000);
const userDelayTime = seedsToProcess.length * (PER_USER_DELAY_MS / 1000);
const estimatedSeconds = batchDelayTime + userDelayTime;
console.log(`[ESTIMATED TIME] ~${Math.round(estimatedSeconds)} seconds (~${Math.round(estimatedSeconds / 60)} minutes)`);
console.log('[STATUS] Starting user seeding process...\n');

async function main() {

  try {
    // Setup Excel file path at the start
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `user_credentials_${timestamp}.xlsx`;
    const dataDir = path.join(process.cwd(), 'prisma', 'data');
    const outputPath = path.join(dataDir, fileName);

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`\n[INFO] Excel file will be saved to: ${outputPath}`);
    console.log('[INFO] Excel file will be updated after each successful user creation\n');

    // Production database safety check
    const databaseUrl = process.env.DATABASE_URL || '';
    const isProduction = databaseUrl.includes('neon.tech') || databaseUrl.includes('production') || databaseUrl.includes('falling-math');

    if (isProduction && testMode) {
      console.warn('\n[WARNING] Production Database - Test Mode Active');
      console.warn(`Processing only ${seedsToProcess.length} records for safety.`);
      console.warn('Set testMode = false to proceed with full import.\n');
    }

    if (isProduction && !testMode) {
      console.warn('\n[PRODUCTION] FULL IMPORT MODE');
      console.warn('================================================================================');
      console.warn(`Database: ${databaseUrl.substring(0, 50)}...`);
      console.warn(`Records to process: ${seedsToProcess.length} users`);
      console.warn('This will create real user accounts in Clerk and production database.');
      console.warn('================================================================================\n');
    }

    const client = await clerkClient();

    const [vaccinationCardType, xRayType, medicalCertType] = await Promise.all([
      prisma.fileType.findFirst({ where: { name: "Vaccination Card", isActive: true }, select: { id: true } }),
      prisma.fileType.findFirst({ where: { name: "X-Ray", isActive: true }, select: { id: true } }),
      prisma.fileType.findFirst({ where: { name: "Medical Certificate", isActive: true }, select: { id: true } }),
    ]);

    if (!vaccinationCardType || !xRayType || !medicalCertType) {
      console.warn('[WARNING] Some FileTypes not found in database. Medical files will not be created.');
      console.warn('   Missing FileTypes:');
      if (!vaccinationCardType) console.warn('   - Vaccination Card');
      if (!xRayType) console.warn('   - X-Ray');
      if (!medicalCertType) console.warn('   - Medical Certificate');
      console.warn('   Please ensure these FileTypes exist in the FileType table.');
    }

    let studentsWithFiles = 0;
    let totalFilesAvailable = 0;
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let newUsersCreatedThisRun = 0; // Track new users created in this session

    // Create nodemailer transporter
    // const transporter = nodemailer.createTransporter({
    //   host: process.env.SMTP_HOST || 'smtp.gmail.com',
    //   port: 587,
    //   secure: false, // true for 465, false for other ports
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });

    // Process in batches to avoid Clerk rate limiting
    const totalBatches = Math.ceil(seedsToProcess.length / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, seedsToProcess.length);
      const batch = seedsToProcess.slice(batchStart, batchEnd);

      // Check if we've hit the max new users limit
      if (newUsersCreatedThisRun >= MAX_NEW_USERS_PER_RUN) {
        console.log('\n' + '='.repeat(80));
        console.log('[LIMIT REACHED] Maximum new users per run reached');
        console.log('='.repeat(80));
        console.log(`[INFO] Created ${newUsersCreatedThisRun} new users in this session`);
        console.log(`[INFO] Stopped at batch ${batchIndex + 1}/${totalBatches}`);
        console.log(`[INFO] Remaining users: ${seedsToProcess.length - batchStart} users`);
        console.log('[INFO] Please wait 24 hours before running again to avoid rate limits');
        console.log('='.repeat(80) + '\n');
        break;
      }

      console.log(`\n[BATCH ${batchIndex + 1}/${totalBatches}] Processing Users ${batchStart + 1}-${batchEnd}`);

      // for loop outside transaction
      for (const seed of batch) {
        await processUsersInBatches({
          count: {
            skippedCount,
            failedCount,
            outputPath,
            successCount,
            studentsWithFiles,
            totalFilesAvailable,
            newUsersCreatedThisRun
          },
          fileType: {
            vaccinationCardType,
            xRayType,
            medicalCertType
          },
          client,
          seed
        });
      }
    }

    // Excel file has been updated continuously throughout the process
    // Final update to ensure all data is saved
    console.log(`\n[INFO] Final Excel file update...`);
    updateCredentialsExcel(userCredentials, outputPath);

    // Log summary
    console.log('\n' + '='.repeat(80));
    console.log('[SUMMARY] SEEDING SUMMARY');
    console.log('='.repeat(80));
    console.log(`[SUCCESS] Successfully created: ${successCount} users`);
    console.log(`[SKIP] Skipped (already exists): ${skippedCount} users`);
    console.log(`[ERROR] Failed: ${failedCount} users`);
    console.log(`[INFO] Total processed: ${seedsToProcess.length} records`);
    console.log(`[INFO] New users created this run: ${newUsersCreatedThisRun}/${MAX_NEW_USERS_PER_RUN} limit`);
    if (newUsersCreatedThisRun >= MAX_NEW_USERS_PER_RUN) {
      console.log('[WARNING] Daily limit reached - run again tomorrow to continue');
    }
    console.log('\n[INFO] Medical Files Summary:');
    console.log('-'.repeat(80));
    console.log(`Students with medical files: ${studentsWithFiles} out of ${seedsToProcess.length}`);
    console.log(`Total File records created: ${totalFilesAvailable}`);
    console.log(`"Medical Records" folders created: ${studentsWithFiles}`);
    console.log('\n[INFO] File records created with Google Drive URLs');
    console.log('   Files are stored with their original Google Drive links.');
    console.log('   File types: Vaccination Card, X-Ray, Medical Certificate');
    console.log('\n[EXPORT] Credentials Export:');
    console.log('-'.repeat(80));
    console.log(`Excel file saved to: ${outputPath}`);
    console.log(`Total credentials exported: ${userCredentials.length}`);
    console.log(`   - Success: ${userCredentials.filter(c => c.status === 'SUCCESS').length}`);
    console.log(`   - Skipped: ${userCredentials.filter(c => c.status === 'SKIPPED').length}`);
    console.log(`   - Failed: ${userCredentials.filter(c => c.status === 'FAILED').length}`);
    console.log('\n[INFO] Next Steps:');
    console.log('-'.repeat(80));
    console.log('1. Review the generated Excel file for user credentials');
    console.log('2. Distribute credentials to users securely');
    console.log('3. Users must change their password on first login');
    console.log('4. Optional: Migrate files from Google Drive to Azure Blob Storage');
    console.log('='.repeat(80) + '\n');
  }
  catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });


const createStrongPassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// const sendWelcomeEmail = async (transporter: nodemailer.Transporter, email: string, firstName: string, lastName: string, password: string) => {
//   const mailOptions = {
//     from: process.env.SMTP_USER,
//     to: email,
//     subject: 'Welcome to Clinic EZ - Your Account is Ready',
//     html: `
//       <h1>Welcome to Clinic EZ!</h1>
//       <p>Dear ${firstName} ${lastName},</p>
//       <p>Your account has been successfully created. Here are your temporary login credentials:</p>
//       <p><strong>Email:</strong> ${email}</p>
//       <p><strong>Temporary Password:</strong> ${password}</p>
//       <p>Please visit <a href="${process.env.APP_URL || 'https://your-app-url.com'}">Clinic EZ</a> to log in and change your password.</p>
//       <p>If you have any questions, feel free to contact support.</p>
//       <p>Best regards,<br>The Clinic EZ Team</p>
//     `,
//   };

//   await transporter.sendMail(mailOptions);
// }
