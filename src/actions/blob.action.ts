import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

export const uploadMediaAction = async (formData: FormData) => {
  const media = formData.get("media") as File;
  const data = await put(media.name, media, {
    access: "public",
  })
  revalidatePath('/')
  return data
}
  