"use client";

import { User } from "@prisma/common/client";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import ActionButton from "@components/ActionButton";
import { updateUserAction } from "@actions/users/user.action";
import { uploadMediaAction } from "@actions/blob.action";
import { toast } from "sonner";
import { revalidatePath } from "@actions/cache.action";
import ConditionalRender from "@components/utils/ConditionalRender";
import { useState } from "react";
import Image from "next/image";
import { compressImageAsync } from "@lib/image-compression";

interface PictureProps {
  user: User;
  readOnly?: boolean;
}

export const Picture = ({ user, readOnly = true }: PictureProps) => {
  const [fileSelected, setFileSelected] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSelected(!!e.target.files?.length);
  }

  const action = async (formData: FormData) => {
    // Add directory to file path
    formData.append("directory", user.userId);

    try {
      // Compress image before uploading
      toast.loading("Compressing...");
      const compressedFile = await compressImageAsync(formData.get("media") as File);
      formData.set("media", compressedFile);
      toast.dismiss();
 
 
      // Upload media to server
      toast.loading("Uploading...");
      const { url } = await uploadMediaAction(formData);
      toast.dismiss();
 
      // Update user picture
      toast.loading("Saving...");
      await updateUserAction(user.userId, { picture: url });
      revalidatePath(`/user/${user.userId}/phr`, "page");
      toast.dismiss();

      toast.success("Saved successfully");

    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error("Something went wrong while processing the image");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar className="rounded w-48 h-48">
        <Image fill className="object-cover" src={user?.picture || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"} alt=""/>
        <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <ConditionalRender condition={!readOnly}>
        <form action={action}>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Picture</Label>
            <Input onChange={handleFileChange} name="media" id="picture" type="file" accept="image/jpeg,image/png" />
          </div>
          <ActionButton disabled={!fileSelected} className="my-5">Upload</ActionButton>
        </form>
      </ConditionalRender>
    </div>
  );
};
