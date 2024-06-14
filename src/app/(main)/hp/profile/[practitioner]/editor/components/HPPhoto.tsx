"use client";

import { upsertDoctorAction } from "@actions/doctor.action";
import { uploadMediaAction } from "@actions/hp.actions";
import { upsertNurseAction } from "@actions/nurse.action";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { HealthcareProviderType } from "@prisma/client";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { HPProfileType } from "../hp-form.schema";
import ActionButton from "@components/ActionButton";

const actions = {
  LAB_TECHNICIAN: upsertNurseAction,
  NURSE: upsertNurseAction,
  DOCTOR: upsertDoctorAction,
}
  

interface HPPhotoProps {
    profile: HPProfileType
}
export default function HPPhoto({profile}: HPPhotoProps) {
    
  const params = useParams() as { practitioner: string }
  const [profileId, setProfileId] = React.useState<number | undefined>(profile.id)
  const searchParams = useSearchParams();
  const practitioner = parseInt(params.practitioner)
  const _type = searchParams.get("_type") as HealthcareProviderType

  const form = useForm<HPProfileType>()

  const action = async (formData: FormData) => {

    const picture = formData.get("picture") as File
    const cover = formData.get("cover") as File
    
    const [pictureUrl, coverUrl] = await Promise.all([
      await (async () => {
        if (!picture.size) return profile.picture
        const form = new FormData()
        form.append("media", picture)
        const { url } = await uploadMediaAction(form);
        return url
      })(),
      await (async () => {
        if (!cover.size) return profile.cover
        const form = new FormData()
        form.append("media", cover)
        const { url } = await uploadMediaAction(form);
        return url
      })()
    ])
    
    await (form.handleSubmit(async (values) => {
      const mappedData = {

        title: profile.title,
        name: profile.name,
        picture: pictureUrl,
        cover: coverUrl,
        
        healthcareProviderId: practitioner
      }
      
      const latestProfile = await actions[_type as keyof typeof actions]({
        where: { id: profileId },
        create: mappedData,
        update: mappedData
      });
      setProfileId(latestProfile.id)
      toast.success("Photos updated successfully.")
      form.reset(values)
    })())
  }

  return (
    <Form {...form}>
      <form action={action} className="prose max-w-full space-y-8 shadow-2xl w-full p-8 bg-white rounded-md">
        <div className="flex flex-col md:flex-row gap-2">
          <FormField
            control={form.control}
            name="picture"
            render={({ field }) => (
              <FormItem className="basis-1/4 flex-grow">
                <FormLabel htmlFor="picture">Profile Picture</FormLabel>
                <FormControl>
                  <Input name="picture" id="picture" type="file"/>
                </FormControl>
                <FormDescription>
                  This is your public display picture.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cover"
            render={({ field }) => (
              <FormItem className="basis-1/4 flex-grow">
                <FormLabel  htmlFor="cover">Cover Photo</FormLabel>
                <FormControl>
                  <Input name="cover" id="cover" type="file"/>
                </FormControl>
                <FormDescription>
                  This is your public display cover photo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4">
          <ActionButton className="w-full">Save Changes</ActionButton>
        </div>
      </form>
    </Form>
  );
}
