"use client";

import { Input } from "@/components/ui/input";
import React from "react";
import { toast } from "sonner";
import ActionButton from "@/components/ActionButton";
import { uploadMediaAction } from "@/actions/blob.action";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { upsertHPAction } from "@/actions/hp.actions";
import { type V2HPProfileType } from "../hp-v2-form.schema";

interface V2HPPhotoProps {
  profile: V2HPProfileType;
  hpId: number;
}

export default function V2HPPhoto({ profile, hpId }: V2HPPhotoProps) {
  const { user } = useUser();
  const userId = user?.id;

  const action = async (formData: FormData) => {
    const picture = formData.get("picture") as File;
    const cover = formData.get("cover") as File;

    const [pictureUrl, coverUrl] = await Promise.all([
      (async () => {
        if (!picture.size) return profile.picture;
        const form = new FormData();
        form.append("media", picture);
        form.append("directory", userId ?? "");
        const { url } = await uploadMediaAction(form);
        return url;
      })(),
      (async () => {
        if (!cover.size) return profile.cover;
        const form = new FormData();
        form.append("media", cover);
        form.append("directory", userId ?? "");
        const { url } = await uploadMediaAction(form);
        return url;
      })(),
    ]);

    const mappedData = {
      name: profile.name,
      picture: pictureUrl,
      cover: coverUrl,
      healthcareProviderId: hpId,
    };

    toast.promise(
      upsertHPAction({
        where: { healthcareProviderId: hpId },
        create: mappedData,
        update: mappedData,
      }),
      {
        loading: "Updating photos...",
        success: () => "Photos updated successfully.",
        error: "Failed to update photos.",
      }
    );
  };

  return (
    <form action={action} className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="v2-picture">Profile Picture</Label>
          <Input name="picture" id="v2-picture" type="file" className="mt-1" accept="image/*" />
          <p className="text-sm text-muted-foreground mt-1">
            Displayed on your public profile.
          </p>
        </div>
        <div className="flex-1">
          <Label htmlFor="v2-cover">Cover Photo</Label>
          <Input name="cover" id="v2-cover" type="file" className="mt-1" accept="image/*" />
          <p className="text-sm text-muted-foreground mt-1">
            Banner image shown at the top of your profile.
          </p>
        </div>
      </div>
      <ActionButton className="w-full">Save Photos</ActionButton>
    </form>
  );
}
