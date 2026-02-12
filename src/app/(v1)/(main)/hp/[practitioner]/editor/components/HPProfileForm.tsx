"use client"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { Input } from "@components/ui/input"
import { useForm } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@components/ui/select"
import { Textarea } from "@components/ui/textarea"
import { Affiliations } from "./Affiliations"
import { Certifications } from "./Certifications"
import { Fields } from "./Fields"
import { Education } from "./Education"
import { Specialties } from "./Specialties"
import { Languages } from "./Languages"
import { HPProfileType, profileSchema } from "../hp-form.schema"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams } from "next/navigation"
import React from "react"
import ActionButton from "@components/ActionButton"
import { upsertHPAction } from "@actions/hp.actions"
import { Separator } from "@components/ui/separator"
import ESignatureUpload from "@components/hp/ESignatureUpload"
import { uploadSignatureAction } from "@actions/hp/signature-upload.action"

type HPProfileProps = {
  profile: HPProfileType
}

export default function HPProfileForm({ profile }: HPProfileProps) {
  const params = useParams() as { practitioner: string }
  const [profileId, setProfileId] = React.useState<number | undefined>(profile.id)
  const [signatureFile, setSignatureFile] = React.useState<File | null>(null)
  const practitioner = parseInt(params.practitioner)

  const form = useForm<HPProfileType>({
    resolver: zodResolver(profileSchema),
    mode: "all",
    defaultValues: profile
  })

  const action = async () => {
    await (form.handleSubmit(async (values: HPProfileType) => {
      let eSignatureUrl = profile.eSignatureUrl;

      if (signatureFile) {
        try {
          const formData = new FormData();
          formData.append("media", signatureFile);
          formData.append("directory", `hp/${practitioner}/signature`);

          const { url } = await uploadSignatureAction(formData);
          eSignatureUrl = url;
        } catch (error) {
          console.error("Signature upload error:", error);
          toast.error("Failed to upload signature. Please try again.");
          return;
        }
      }

      const mappedData = {
        title: values.title,
        name: values.name,
        suffix: values.suffix,
        workEmail: values.workEmail,
        workPhone: values.workPhone,
        philosophy: values.philosophy,
        areaOfInterest: values.areaOfInterest,
        experience: values.experience,
        hobbies: values.hobbies,
        eSignatureUrl: eSignatureUrl,

        languages: values.languages.map((lang) => lang.name),
        specialties: values.specialties.map((lang) => lang.name),
        educations: values.educations.map((lang) => lang.name),
        certifications: values.certifications.map((lang) => lang.name),
        fields: values.fields.map((lang) => lang.name),
        affiliations: values.affiliations.map((lang) => lang.name),
        healthcareProviderId: practitioner,
      }

      toast.promise(upsertHPAction({
        where: { id: profileId },
        create: mappedData,
        update: mappedData
      }), {
        loading: signatureFile ? "Uploading signature and saving profile..." : "Saving profile...",
        success: (res) => {
          if (res) {
            setProfileId(res.id)
            form.reset(values)
            setSignatureFile(null)

            const fileInput = document.getElementById('signature-file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          }
          return signatureFile ? "Profile and signature saved successfully!" : "Profile updated successfully."
        },
        error: "Failed to update profile."
      })
    })())
  }


  return (
    <Form {...form}>
      <form action={action} className="prose max-w-full space-y-8 shadow-2xl w-full p-8 bg-white rounded-md">
        <div className="flex flex-col md:flex-row gap-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="basis-1/4 flex-grow">
                <FormLabel>Title</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a title to display" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Select Your Title</SelectLabel>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Dra.">Dra.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormDescription>
                  This will display as your title in your public profile.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe Dao" {...field} />
                </FormControl>
                <FormDescription>
                  This will display as your name in your public profile.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="suffix"
            render={({ field }) => (
              <FormItem className="basis-1/4 flex-grow">
                <FormLabel>Suffix</FormLabel>
                <FormControl>
                  <Input placeholder="Jr." {...field} />
                </FormControl>
                <FormDescription>
                  Jr., Sr., III, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="workEmail"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Work Email</FormLabel>
              <FormControl>
                <Input placeholder="example@email.com" {...field} />
              </FormControl>
              <FormDescription>
                It can be used to contact you.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workPhone"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Work Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Phone no." {...field} />
              </FormControl>
              <FormDescription>
                It can be used to contact you by your potential clients.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="philosophy"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Philosophy of Care</FormLabel>
              <FormControl>
                <Textarea placeholder="" {...field} />
              </FormControl>
              <FormDescription>
                Describes your philosophy of care.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="areaOfInterest"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Area of Interest</FormLabel>
              <FormControl>
                <Textarea placeholder="" {...field} />
              </FormControl>
              <FormDescription>
                In which area you are more interested?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hobbies"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Hobbies</FormLabel>
              <FormControl>
                <Textarea placeholder="" {...field} />
              </FormControl>
              <FormDescription>
                What are your hobbies?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Experiences</FormLabel>
              <FormControl>
                <Input placeholder="You earned experience" {...field} />
              </FormControl>
              <FormDescription>
                Let us know about your experiences. How many years of experience you have?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Languages form={form} />
        <Separator />
        <Fields form={form} />
        <Separator />
        <Specialties form={form} />
        <Separator />
        <Education form={form} />
        <Separator />
        <Certifications form={form} />
        <Separator />
        <Affiliations form={form} />
        <Separator />
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-4">E-Signature Upload</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your digital signature for use on medical certificates and official documents.
          </p>
          <ESignatureUpload
            currentSignatureUrl={profile.eSignatureUrl}
            onFileChange={setSignatureFile}
          />
        </div>
        <Separator />
        <div className="mt-4">
          <ActionButton className="w-full" disabled={form.formState.isLoading}>Save Changes</ActionButton>
        </div>
      </form>
    </Form>
  )
}
