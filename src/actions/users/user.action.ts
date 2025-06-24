"use server";
import 'server-only'
import prisma from "@lib/prisma";
import { Prisma, $Enums  } from "@prisma/client";
import { managementClient } from "@services/auth0/management-client";
import { cache } from 'react';
import dayjs from 'dayjs';
import path from 'path';
import fs from "fs/promises";
import { sendMail } from '@actions/email.action';
import { faker } from '@faker-js/faker';
import { hasCodeProperty } from '@lib/utils';
import { withErrorHandling } from '@/lib/with-error-handling';
import { updateAuth0UserAction } from './user-management.action';
import { getPermissionsAction } from '../permission.action';
import { sessionCheck } from '@/lib/auth';

export type PrismaTransactionalClient = Parameters<Parameters<typeof prisma['$transaction']>[0]>[0];

export type GetUsersFilters = {
  orgUid?: string
  search?: string
  page?: number
  pageSize?: number
  userId?: string
  email?: string
}

export type GetUsers = Awaited<ReturnType<typeof getUsersAction>>
export const getUsersAction = cache(async (filters:GetUsersFilters) => {

  await sessionCheck();
  
  const { orgUid, search, page = 1, pageSize = 100, userId, email } = filters || {};
  return await prisma.$transaction(async (prisma) => {
    const users = await prisma.user.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      where: {
        userId, 
        email,
        ...orgUid ? { 
          OrganizationMembers: { 
            some: { 
              Organization: {
                orgUid
              } 
            }
          } 
        } : {},
        ...search ? {
          OR: [
            { firstName: { mode: "insensitive", contains: search } },
            { lastName: { mode: "insensitive", contains: search } },
            { middleName: { mode: "insensitive", contains: search } },
            { email: { mode: "insensitive", contains: search } }
          ]
        }: {},
        isActive: true
      },
      include: {
        OrganizationMembers: {
          distinct: "organizationId",
          where: {
            Organization: {
              orgUid
            }
          },
          select: {
            status: true,
          }
        }
      }
    })
    const total = await prisma.user.count({ where: {
      ...orgUid ? { 
        OrganizationMembers: { 
          some: { 
            Organization: {
              orgUid
            } 
          }
        } 
      } : {},
      ...search ? {
        OR: [
          { firstName: { mode: "insensitive", contains: search } },
          { lastName: { mode: "insensitive", contains: search } },
          { middleName: { mode: "insensitive", contains: search } },
          { email: { mode: "insensitive", contains: search } }
        ]
      }: {},
      isActive: true
    } })
    return [ users, total ] as const;
  }, {
    timeout: 10000,
    maxWait: 5000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
  });
})

export type GetUser = Awaited<ReturnType<typeof getUserAction>>
export const getUserAction = withErrorHandling(cache(async (key: string, orgUid?: string)=> {

  await sessionCheck();

  const user = await prisma.user.findFirstOrThrow({ 
    where: { 
      isActive: true,
      OR: [
        { userId: key },
        { email: key }
      ], 
      ...orgUid ? {
        Organizations: { 
          some: { 
            Organization: {
              orgUid
            } 
          }
        }
      } : {},
    },
    include: {
      HealthcareProviders: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        }
      },
      ClinicMembers: {
        where: {},
      },
      OrganizationMembers: {
        where: {
          Organization: {
            isActive: true,
            orgUid
          }
        },
        select: {
          OrgMemberPermissions: {
            select: {
              OrganizationMember: {
                select: {
                  Organization: {
                    select: {
                      orgUid: true,
                      name: true
                    }
                  }
                }
              },
              Permission: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
      
  }); 
  return { success: true,  message: "User found",  data: user }
}))

type CreateUserPayload = {
  email: string
  mobile: string
  firstName: string
  lastName: string
  gender?: $Enums.Gender
  dob?: Date,
  roleName?: string
  clinicUid?: string
}
export const createUserAction = withErrorHandling(async (payload: CreateUserPayload) => {

  await sessionCheck();
  
  const { mobile, gender, dob, clinicUid} = payload
  let clinicName: string | null = null 

  const newUser = await prisma.$transaction(async (prisma) => {

    // generate strong password 
    const randomPassword = generateRandomPassword();

    // create user in auth0
    const { data, status } = await createUserInAuth0({...payload, password: randomPassword});

    if(status !== 201) throw new Error("Failed to create user in auth0");
      
    // create user in database
    const newUser = await createUserToDb(prisma, {
      userId: data.user_id,
      email: data.email,
      mobile: mobile,
      firstName: data.given_name,
      lastName: data.family_name,
      gender: gender,
      dob: dayjs(dob).toDate(),
      picture: data.picture
    });

    if(!newUser) throw new Error("Failed to create user in db");

    // assign user permissions
    await assignUserPermission(prisma, newUser.id);

    // add user to clinic
    if(clinicUid) {
     
      const clinicPatient = await createClinicPatient(prisma, newUser.userId, clinicUid);
      clinicName = clinicPatient.Clinic.name
      
      // assign clinic patient permissions
      await assignClinicPatientPermission(prisma, clinicPatient.id)
    }

    await sendCreateUserNotification({
      email: newUser.email,
      password: randomPassword,
      senderName: clinicName ?? undefined
    });
      
    return newUser;
  })
   
  return {
    message: "User created successfully",
    data: newUser
  }
}, async (error) => {
  return "Failed to create user";
})

export const updateUserAction = withErrorHandling(async (userId: string, data: Prisma.UserUpdateArgs["data"]) => {
  
  await sessionCheck();

  const updatedUser = await prisma.user.update({
    where: { userId },
    data
  });
  
  const {firstName, lastName, middleName, suffix, picture, nickname} = updatedUser

  await updateAuth0UserAction(updatedUser.userId, {
    name: `${firstName ?? ""} ${middleName ?? ""} ${lastName ?? ""} ${suffix ?? ""}`.trim(),
    given_name: firstName ?? undefined,
    family_name: lastName ?? undefined,
    nickname: nickname ?? `${firstName} ${lastName}`,
    picture: picture ?? undefined
  })

  return {message: "User updated successfully", data: updatedUser};
})

export const resetPasswordAction = async (userId: string, password: string) => {
  const res = await managementClient.users.update({id: userId}, {
    password
  })
  return [200, 201, 200].includes(res.status);
}

type SendCreateUserNotification = {
  email: string, 
  password: string
  senderName?: string
}
const sendCreateUserNotification = async ({email, password, senderName}: SendCreateUserNotification) => {
  // send email notification
  try {
    const filePath = path.join(process.cwd(), "email-templates/org-membership-user-created.html");
    const emailTemplate = await fs.readFile(filePath, "utf-8");
    const appName = process.env.NEXT_PUBLIC_APP_NAME!;
    const html = emailTemplate.replaceAll("@{email}", email).replaceAll("@{password}", password).replaceAll("@{appName}", appName).replaceAll("@{orgName}", senderName ?? "")

    await sendMail({
      subject: `Welcome to ${appName} - Account Created`,
      to: email,
      text: html,
      html
    })
    return true
  } catch (error) {
    console.error(`Error sending email notification: ${error}`);
    return false
  }
}

export const findOrCreateUserAction = withErrorHandling(cache(async () => {

  const session = await sessionCheck();
  let message = "User found and created";

  const user = await prisma.$transaction(async (prisma) => {
    
    // step 1: find user in db
    let dbUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub
      }
    })
    
    // step 2: create user in db if not found
    if(dbUser === null) {
      dbUser = await createUserToDb(prisma, {
        userId: session.user.sub,
        email: session.user.email,
        mobile: "",
        firstName: session.user.given_name,
        lastName: session.user.family_name
      })
      
      await assignUserPermission(prisma, dbUser.id);
    }

    return dbUser;
      
  }, {
    timeout: 5000,
    maxWait: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database
  })

  return { success: true, message, data: user }
  
}), async (error) => {
  if(hasCodeProperty(error) ) {
    if(error.code === "P2002") {

      const session = await sessionCheck();
      await managementClient.users.delete({ id: session.user.sub });
      return "User not found and failed to create user";

    }
    if(error.code === "P2025 ") 
      return "User already exists in the system and associated with another account";
  };
});


const assignUserPermission = async (prisma: PrismaTransactionalClient, userId: number) => {
  
  const permissions = await getPermissionsAction({type: "USER"});

  const userPermission = await prisma.userPermission.createMany({
    skipDuplicates: true,
    data: permissions.map(permission => ({
      permissionId: permission.id,
      userId
    }))
  })
  
  return userPermission;

}

const assignClinicPatientPermission = async (prisma: PrismaTransactionalClient, clinicPatientId: number, clinicRoleName = "patient") => {
  
  const permissions = await prisma.clinicRoleInitialPermission.findMany({
    where: {
      ClinicRole: {
        name: clinicRoleName
      }
    }
  })

  // create user clinic permissions
  const clinicPatientPermissions = await prisma.clinicPatientPermission.createMany({
    skipDuplicates: true,
    data: permissions.map(permission => ({
      clinicPatientId: clinicPatientId,
      permissionId: permission.permissionId,
    }))
  })

  return clinicPatientPermissions;

}

const assignClinicMemberPermission = async (prisma: PrismaTransactionalClient, clinicMemberId: number, clinicRoleName: string) => {
  
  const permissions = await prisma.clinicRoleInitialPermission.findMany({
    where: {
      ClinicRole: {
        name: clinicRoleName
      }
    }
  })

  // create user clinic permissions
  const clinicMemberPermissions = await prisma.clinicMemberPermission.createMany({
    skipDuplicates: true,
    data: permissions.map(permission => ({
      clinicMemberId: clinicMemberId,
      permissionId: permission.permissionId,
    }))
  })

  return clinicMemberPermissions;

}

const createClinicPatient = async (prisma: PrismaTransactionalClient, userId: string, clinicUid: string) => {
    
  const clinicPatient = await prisma.clinicPatient.create({
    data: {
      Patient: {
        connect: {
          userId
        }
      },
      Clinic: {
        connect: {
          clinicUid
        }
      }
    },
    select: {
      id: true,
      clinicId: true,
      Clinic: {
        select: {
          name: true
        }
      }
    }
  })
  
  return clinicPatient;
}

type createUserToDbPayload = {
  userId: string
  email: string
  mobile: string
  firstName: string
  lastName: string,
  gender?: $Enums.Gender,
  dob?: Date,
  picture?: string
}
const createUserToDb = async (prisma: PrismaTransactionalClient, payload: createUserToDbPayload) => {
  
  const { userId, email, mobile, firstName, lastName, dob = null, gender = null, picture} = payload;
    
  const newUser = await prisma.user.create({
    data: { userId, email, mobile, firstName, lastName, dob, gender, picture  }
  });

  return newUser
  
}

type CreateUserInAuth0Payload = {
  email: string
  firstName: string
  lastName: string
  password: string
}
const createUserInAuth0 = async (payload: CreateUserInAuth0Payload) => {

  const {email, firstName, lastName, password} = payload
  
  const { data, status } = await managementClient.users.create({
    email,
    password,
    given_name: firstName,
    family_name: lastName,
    name: `${firstName} ${lastName}`,
    nickname: `${firstName} ${lastName}`,
    connection: "Username-Password-Authentication",
  })

  return { data, status }
}

const generateRandomPassword = () => {
  // generate strong password // lowercase, uppercase, number, special character
  return faker.internet.password({
    length: 12,
    pattern: /[A-Za-z\d!@#$%^&*()_+]/,
  });
}