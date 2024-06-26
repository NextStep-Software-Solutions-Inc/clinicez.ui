"use server";

import { uploadFile } from "@services/azure-blob";
// import { put } from "@vercel/blob";

export const uploadMediaAction = async (formData: FormData) => {
  const media = formData.get("media") as File;
  const size = media.size / 1024 / 1024;
  if (size > 10) {
    throw new Error("File size should not exceed 10MB");
  }
  const data = await uploadFile(media.name, await media.arrayBuffer());

  // const data = await put(media.name, media, {
  //   access: "public",
  // })
  return data
}
  