"use server";

import prismaCommon from "@lib/prisma-common";
import { Prisma } from "@prisma/common/client";
import crypt from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

const lastCallTimes = new Map<string, number>();
const throttleDuration = 1000 * 60 * 5; // 5 minutes

export const createActivationCodeAction = async (email: string): Promise<string | null> => {

  const lastCallTime = lastCallTimes.get(email);
  if (lastCallTime && Date.now() - lastCallTime < throttleDuration) {
    throw new Error("You can only request an activation code every 5 minutes");
  }

  const code = await codePromise();
  await prismaCommon.activationCode.create({
    data: {
      code,
      User: {
        connect: { email }
      },
      expiresAt: dayjs().add(5, "minutes").toDate()
    }
  })
  lastCallTimes.set(email, Date.now());
  return code;
}

const codePromise = () => new Promise<string>((resolve, reject) => {
  crypt.generateKey("hmac", { length: 128 }, (error, key) => {
    if (error) {
      reject(error);
    } else {
      const code = key.export().toString("base64url");
      resolve(code);
    }
  });
});

export const verifyActivationCodeAction = async (email: string, code: string) => {
  return await prismaCommon.$transaction(async (prismaCommon) => {
    await prismaCommon.activationCode.findUniqueOrThrow({
      where: {
        code,
        expiresAt: { gte: new Date() },
        User: { email },
        isUsed: false
      }
    });

    await prismaCommon.activationCode.update({ 
      where: { code },
      data: { isUsed: true }
    });
    return true;
  },
  {
    timeout: 5000,
    maxWait: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  })
}