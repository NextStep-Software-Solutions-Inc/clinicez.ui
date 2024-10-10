"use server";
import 'server-only'
import prismaCommon from "@lib/prisma-common";
import { Prisma, $Enums, PrismaClient  } from "@prisma/common/client";
import { managementClient } from "@services/auth0/management-client";
import { cache } from 'react';
import dayjs from 'dayjs';
import { getCachedSession } from '@actions/session.action';
import path from 'path';
import fs from "fs/promises";
import { sendMail } from '@actions/email.action';
import { faker, th } from '@faker-js/faker';


export type GetUsersFiltersType = {
  orgId?: string
  search?: string
  page?: number
  pageSize?: number
  userId?: string
  email?: string
}

export type GetUsers = Awaited<ReturnType<typeof getUsersAction>>
export const getUsersAction = cache(async (filter?:GetUsersFiltersType) => {
  const { orgId, search, page = 1, pageSize = 100, userId, email } = filter || {};
  return await prismaCommon.$transaction(async (prisma) => {
    const users = await prisma.user.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      where: {
        userId, 
        email,
        ...orgId ? { 
          Organizations: { 
            some: { 
              Organization: {
                orgId
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
        Organizations: {
          distinct: "organizationId",
          where: {
            Organization: {
              orgId
            }
          },
          select: {
            status: true,
          }
        }
      }
    })
    const total = await prisma.user.count({ where: {
      ...orgId ? { 
        Organizations: { 
          some: { 
            Organization: {
              orgId
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
export const getUserAction = cache(async (key: string, orgUid?: string)=> {
  try {
    const user = await prismaCommon.user.findFirstOrThrow({ 
      where: { 
        isActive: true,
        OR: [
          { userId: key },
          { email: key }
        ], 
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
        OrgUserPermissions: {
          where: {
            Organization: {
              isActive: true,
              orgId: orgUid
            }
          },
          select: {
            Organization: {
              select: {
                orgId: true,
                name: true
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
      
    }); 
    return {
      success: true,
      message: "User found",
      data: user
    }
  } catch (error) {
    console.error(`Error fetching user: ${error}`);
    let message = "Failed to fetch user";
    if(error instanceof Error) {
      message = error.message
    }
    return {
      success: false,
      message,
      data: null
    }
  }
})

type CreateUserPayload = {
  email: string
  mobile: string
  firstName: string
  lastName: string
  gender?: $Enums.Gender
  dob?: Date,
  userRoleId?: number
  orgUid?: string
}
export const createUserAction = async (payload: CreateUserPayload) => {
  const session = await getCachedSession();
  if(!session) return {
    success: false,
    message: "Unauthorized",
    data: null
  }

  try {
    // generate strong password // lowercase, uppercase, number, special character
    const randomPassword = faker.internet.password({
      length: 12,
      pattern: /[A-Za-z\d!@#$%^&*()_+]/,
    });
    let orgName: string | null = null 
    const newUser = await prismaCommon.$transaction(async (prisma) => {
      // create user in auth0
      const { data, status } = await managementClient.users.create({
        given_name: payload.firstName,
        family_name: payload.lastName,
        name: `${payload.firstName} ${payload.lastName}`,
        email: payload.email,
        password: randomPassword,
        nickname: `${payload.firstName} ${payload.lastName}`,
        connection: "Username-Password-Authentication",
      })

      if(status !== 201) throw new Error("Failed to create user in auth0");
      
      // create user in database
      const newUser = await insertUserInDb(prisma, {
        userId: data.user_id,
        email: data.email,
        mobile: payload.mobile,
        firstName: data.given_name,
        lastName: data.family_name,
        gender: payload.gender,
        dob: dayjs(payload.dob).toDate(),
      });

      if(!newUser.data) throw new Error("Failed to create user in db");

      // add user to organization
      if(payload.userRoleId && payload.orgUid) {
        const userOrganization = await prisma.userOrganization.create({
          data: {
            User: {
              connect: {
                userId: newUser.data.userId
              }
            },
            Organization: {
              connect: {
                orgId: payload.orgUid
              }
            },
            UserRole: {
              connect: {
                id: payload.userRoleId
              }
            },
            status: "ACTIVE"
          },
          select: {
            organizationId: true,
            role: true,
            Organization: {
              select: {
                name: true
              }
            }
          }
        })
        orgName = userOrganization.Organization.name
        // find initial permissions for the role
        const permissions = await prisma.orgRoleInitialPermission.findMany({
          where: {
            orgRoleId: userOrganization.role
          }
        })

        // create user organization permissions
        await prisma.orgUserPermission.createMany({
          skipDuplicates: true,
          data: permissions.map(permission => ({
            userId: newUser.data.id,
            permissionId: permission.permissionId,
            orgId: userOrganization.organizationId
          }))
        })
      }

      await sendCreateUserNotification({
        email: newUser.data.email,
        password: randomPassword,
        orgName: orgName ?? undefined
      });
      
      return newUser;
    })
   
    return {
      success: true,
      message: "User created successfully",
      data: newUser
    }
  } catch (error) {
    console.error(`Error creating user: ${error}`);
    let message = "Failed to create user";
    if(error instanceof Error) {
      message = error.message
    }
    return {
      success: false,
      message,
      data: null
    }
  }
}

export const updateUserAction = async (userId: string, data: Prisma.UserUpdateArgs["data"]) => {
  const updatedUser = await prismaCommon.user.update({
    where: { userId },
    data
  });
  return updatedUser;
}

export const resetPasswordAction = async (userId: string, password: string) => {
  const res = await managementClient.users.update({id: userId}, {
    password
  })
  return [200, 201, 200].includes(res.status);
}

type SendCreateUserNotification = {
  email: string, 
  password: string
  orgName?: string
}
const sendCreateUserNotification = async ({email, password, orgName}: SendCreateUserNotification) => {
  // send email notification
  try {
    const filePath = path.join(process.cwd(), "email-templates/org-membership-user-created.html");
    const emailTemplate = await fs.readFile(filePath, "utf-8");
    const appName = process.env.NEXT_PUBLIC_APP_NAME!;
    const html = emailTemplate.replaceAll("@{email}", email).replaceAll("@{password}", password).replaceAll("@{appName}", appName).replaceAll("@{orgName}", orgName ?? "")

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

export const findAndCreateUserAction = cache(async () => {
  const session = await getCachedSession();
  if(!session) {
    return {
      success: false,
      message: "Unauthorized",
      data: null
    }
  }

  try {
    const user = await prismaCommon.$transaction(async (prisma) => {
      let dbUser = await prisma.user.findUnique({
        where: {
          userId: session.user.sub
        }
      })

      // create user if not found
      if(!dbUser) {
        const newUser = await insertUserInDb(prisma, {
          userId: session.user.sub,
          email: session.user.email,
          mobile: "",
          firstName: session.user.given_name,
          lastName: session.user.family_name
        })
        if(!newUser.success) {
          await managementClient.users.delete({ id: session.user.sub });
          throw new Error("User not found in db and email is taken. Action: User deleted in auth0");
        }
        dbUser = newUser.data
      }
      return dbUser;
    }, {
      timeout: 5000,
      maxWait: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database
    })

    return {
      success: true,
      message: "User found and created",
      data: user
    }
  } catch (error) {
    console.error(`Error finding and creating user: ${error}`);
    let message = "Failed to find and create user";
    if(error instanceof Error) {
      message = error.message
    }
    if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      message = "User already exists in the db and associated with another user";
    }
    return {
      success: false,
      message,
      data: null
    }
  }
})

export type PrismaTransactionalClient = Parameters<
    Parameters<typeof prismaCommon['$transaction']>[0]
>[0];
const insertUserInDb = async (prisma: PrismaTransactionalClient, payload: {
  userId: string
  email: string
  mobile: string
  firstName: string
  lastName: string,
  gender?: $Enums.Gender,
  dob?: Date
}) => {
  try {
    const newUser = await prisma.user.create({
      data: {
        userId: payload.userId,
        email: payload.email,
        mobile: payload.mobile,
        firstName: payload.firstName,
        lastName: payload.lastName,
        dob: payload.dob,
        gender: payload.gender
      }
    });
    return {
      success: true,
      message: "User created successfully",
      data: newUser
    }
  } catch (error) {
    console.error(`Error creating user in db: ${error}`);
    return {
      success: false,
      message: "Failed to create user in db",
      data: null
    }
  }
}