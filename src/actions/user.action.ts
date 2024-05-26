"use server";

import { faker } from "@faker-js/faker";
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
  console.log("Getting users...ewe");
  return Array.from({ length: faker.number.int({min: 5, max:15}) }, generateRandomUser);
})

export const getUserAction = cache(async (id: string) => {
  console.log("Getting user...", id);
  return {...generateRandomUser(), id};
})