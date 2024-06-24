"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";
import 'server-only'


export const getUsersAction = async () => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true
    }
  });
  return users;
}

export const getUserAction = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({ 
    where: { 
      isActive: true,
      userId
    } 
  }); 
  return user;
}

export const createUserAction = async (data: Prisma.UserCreateArgs["data"]) => {

  const newUser = await prisma.user.create({
    data
  });

  return newUser;
}

export const updateUserAction = async (userId: string, data: Prisma.UserUpdateArgs["data"]) => {
  const updatedUser = await prisma.user.update({
    where: { userId },
    data
  });
  console.log({updatedUser});
  
  return updatedUser;
}