"use server"

import fs from "fs"
import path from "path"
import { faker } from "@faker-js/faker"

import { labels, priorities, statuses } from "./data"

const tasks = Array.from({ length: 100 }, () => ({
  id: `${faker.number.int({ min: 1000, max: 9999 })}`,
  subject: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
  status: faker.helpers.arrayElement(statuses).value,
  label: faker.helpers.arrayElement(labels).value,
  priority: faker.helpers.arrayElement(priorities).value,
}))


fs.writeFileSync(
  "public/json/consultations.json",
  JSON.stringify(tasks, null, 2)
)

console.log("✅ Tasks data generated.")
