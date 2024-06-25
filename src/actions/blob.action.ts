"use server";

import { uploadFile } from "@services/azure-blob";
// import { put } from "@vercel/blob";

export const uploadMediaAction = async (formData: FormData) => {
  const media = formData.get("media") as File;
  const data = await uploadFile(media.name, await media.arrayBuffer());

  // const data = await put(media.name, media, {
  //   access: "public",
  // })
  return data
}
  