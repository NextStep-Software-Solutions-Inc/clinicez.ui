"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";
import { cache } from "react";
import 'server-only'


export const getUsersAction = cache(async () => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true
    }
  });
  return users;
})

export const getUserAction = cache(async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({ 
    where: { 
      isActive: true,
      userId
    } 
  }); 
  return user;
})


export const createUserAction = async (data: Prisma.UserCreateArgs["data"]) => {

  const newUser = await prisma.user.create({
    data: { 
      ...data
    }
  });

  return newUser;
}
