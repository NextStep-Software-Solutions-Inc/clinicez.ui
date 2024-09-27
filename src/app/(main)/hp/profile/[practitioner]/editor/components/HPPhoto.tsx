"use client"

import { Input } from "@components/ui/input";
import { HealthcareProviderType } from "@prisma/common/client";
import React from "react";
import { toast } from "sonner";
import { HPProfileType } from "../hp-form.schema";
import ActionButton from "@components/ActionButton";
import { uploadMediaAction } from "@actions/blob.action";
import { Label } from "@components/ui/label";
import { useUser } from "@auth0/nextjs-auth0/client";
import { upsertHPAction } from "@actions/hp.actions";

interface HPPhotoProps {
  profile: HPProfileType
  hpId: number
  type: HealthcareProviderType
}

export default function HPPhoto({profile, hpId, type}: HPPhotoProps) {
  const user = useUser()
  const userId = user?.user?.sub
    
  const action = async (formData: FormData) => {
    
    const picture = formData.get("picture") as File
    const cover = formData.get("cover") as File
    
    const [pictureUrl, coverUrl] = await Promise.all([
      (async () => {
        if (!picture.size) return profile.picture
        const form = new FormData()
        form.append("media", picture)
        form.append("directory", userId ?? "")
        const { url } = await uploadMediaAction(form);
        return url
      })(),
      (async () => {
        if (!cover.size) return profile.cover
        const form = new FormData()
        form.append("media", cover)
        form.append("directory", userId ?? "")
        const { url } = await uploadMediaAction(form);
        return url
      })()
    ])

    const mappedData = {
      title: profile.title,
      name: profile.name,
      picture: pictureUrl,
      cover: coverUrl,
      healthcareProviderId: hpId
    }

    toast.promise(upsertHPAction({
      where: { healthcareProviderId: hpId },
      create: mappedData,
      update: mappedData
    }), {
      loading: "Updating photos...",
      success: (latestProfile) => {
        return "Photos updated successfully."
      },
      error: "Failed to update photos."
    })
    
  }

  return (
   
    <form action={action} className="prose max-w-full space-y-8 shadow-2xl w-full p-8 bg-white rounded-md">
      <div className="flex flex-col md:flex-row gap-2">
        
        <div className="basis-1/4 flex-grow">
          <Label htmlFor="picture">Profile Picture</Label>
          <Input name="picture" id="picture" type="file"/>
          <p>
            The profile picture is displayed on your profile page.
          </p>
        </div>
        
        <div className="basis-1/4 flex-grow">
          <Label  htmlFor="cover">Cover Photo</Label>
          <Input name="cover" id="cover" type="file"/>
          <p>
            The cover photo is displayed on your profile page.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <ActionButton className="w-full">Save Changes</ActionButton>
      </div>
    </form>
  );
}
