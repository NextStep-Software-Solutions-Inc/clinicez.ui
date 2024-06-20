"use server";

import { put } from "@vercel/blob";

export const uploadMediaAction = async (formData: FormData) => {
  const media = formData.get("media") as File;
  const data = await put(media.name, media, {
    access: "public",
  })
  return data
}
  