"use server";

import { faker } from "@faker-js/faker";
import prisma from "@lib/prisma";
import { Prisma, User } from "@prisma/client";
import { cache } from "react";
import 'server-only'

const generateRandomUser = () => {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    gender: faker.helpers.arrayElement(["Male", "Female"]),
    dob: faker.date.birthdate(),
    avatar: faker.image.avatar(),
  }
}

export const getUsersAction = cache(async () => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true
    }
  });
  return users;
})

export const getUserAction = cache(async (id: string) => {
  console.log("Getting user...", id);
  return {...generateRandomUser(), id};
})


export const createUserAction = async (data: Prisma.UserCreateArgs["data"]) => {

  const newUser = await prisma.user.create({
    data: { 
      ...data
    }
  });

  return newUser;
}
