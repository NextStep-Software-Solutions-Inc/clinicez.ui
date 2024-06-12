"use server";

import { faker } from "@faker-js/faker";
import { delay } from "@lib/wait";

export const uploadFileAction = async (data: FormData) => {
  console.log("Uploading file...", Object.fromEntries(data));
  await delay(3000);
  return true;
}

export const getFilesAction = async (id: string) => {
  console.log("Getting files...", id);
  const createFiles = () => {
    const files = []
    const numberOfFiles = faker.number.int({ min: 2, max: 20 })
    for (let i = 0; i < numberOfFiles; i++) {
      const file = {
        id: faker.string.uuid(),
        name: faker.word.adjective() + " " + faker.word.noun(),
        description: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(["document", "image"]),
        date: faker.date.past(),
        url: faker.image.url(),
      }
      files.push(file)
    }
    return files
  }
  const createFolder = () => {
    const folder = {
      id: faker.string.uuid(),
      name: faker.word.adjective() + " " + faker.word.noun(),
      description: faker.lorem.sentence(),
      files: createFiles()
    }
    return folder
  }

  await delay(3000);
  return Array.from({ length: faker.number.int({min: 5, max:15}) }, createFolder);
}

export const createFolderAction = async (data: FormData) => {
  console.log("Creating folder...", Object.fromEntries(data));
  await delay(3000);
  return true;
}


export const deleteFileAction = async (id: string) => {
  console.log("Deleting file...", id);
  await delay(3000);
  return true;
}

export const getAttachmentTypesAction = async () => {
  console.log("Getting attachment types...");
  await delay(3000);
  return Array.from({ length: faker.number.int({min: 5, max:15}) }, () => {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(2),
      description: faker.lorem.sentence(),
    }
  });
}