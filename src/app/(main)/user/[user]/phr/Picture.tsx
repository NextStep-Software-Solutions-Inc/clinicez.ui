"use client";

import { User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import ActionButton from "@components/ActionButton";
import { updateUserAction } from "@actions/user.action";
import { uploadMediaAction } from "@actions/blob.action";
import { toast } from "sonner";
import { revalidatePath } from "@actions/cache.action";
import ConditionalRender from "@components/utils/ConditionalRender";

interface PictureProps {
  user: User;
  disabled?: boolean;
}

export const Picture = async ({ user, disabled = true }: PictureProps) => {
  
  const action = async (formData: FormData) => {
    toast.promise(uploadMediaAction(formData), {
      loading: "Uploading...",
      success: ({url}) => {
        toast.promise(updateUserAction(user.userId, { picture: url }), {
          loading: "Saving...",
          success: () => {
            revalidatePath(`/user/${user.userId}/phr`, "page");
            return "Saved successfully";
          },
          error: "Uploaded to server but failed to save in database"
        })
        return "Uploaded successfully";
      },
      error: "Failed to upload"
    });
    
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar className="rounded w-48 h-48">
        <AvatarImage src={user?.picture || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"} />
        <AvatarFallback> ME</AvatarFallback>
      </Avatar>
      <ConditionalRender condition={!disabled}>
        <form action={action}>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Picture</Label>
            <Input name="media" id="picture" type="file" accept="image/jpeg,image/png" />
          </div>
          <ActionButton className="my-5">Upload</ActionButton>
        </form>
      </ConditionalRender>
    </div>
  );
};
