"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import ActionButton from "@/components/ActionButton";
import { upsertHPAction } from "@/actions/hp.actions";
import { Separator } from "@/components/ui/separator";
import ESignatureUpload from "@/components/hp/ESignatureUpload";
import { uploadSignatureAction } from "@/actions/hp/signature-upload.action";
import { Button } from "@/components/ui/button";
import { v2ProfileSchema, type V2HPProfileType } from "../hp-v2-form.schema";

type V2HPProfileFormProps = {
  profile: V2HPProfileType;
  hpId: number;
};

const TITLE_OPTIONS = [
  { value: "Mr.", label: "Mr." },
  { value: "Mrs.", label: "Mrs." },
  { value: "Ms.", label: "Ms." },
  { value: "Dr.", label: "Dr." },
  { value: "Dra.", label: "Dra." },
  { value: "Prof.", label: "Prof." },
];

const NO_TITLE_VALUE = "__none__";

export default function V2HPProfileForm({ profile, hpId }: V2HPProfileFormProps) {
  const [profileId, setProfileId] = React.useState<number | undefined>(profile.id);
  const [signatureFile, setSignatureFile] = React.useState<File | null>(null);

  const form = useForm<V2HPProfileType>({
    resolver: zodResolver(v2ProfileSchema),
    mode: "all",
    defaultValues: profile,
  });

  const languageFields = useFieldArray({ control: form.control, name: "languages" });
  const specialtyFields = useFieldArray({ control: form.control, name: "specialties" });
  const educationFields = useFieldArray({ control: form.control, name: "educations" });
  const certificationFields = useFieldArray({ control: form.control, name: "certifications" });
  const fieldOfPracticeFields = useFieldArray({ control: form.control, name: "fields" });
  const affiliationFields = useFieldArray({ control: form.control, name: "affiliations" });

  const action = async () => {
    await form.handleSubmit(async (values: V2HPProfileType) => {
      let eSignatureUrl = profile.eSignatureUrl;

      if (signatureFile) {
        try {
          const formData = new FormData();
          formData.append("media", signatureFile);
          formData.append("directory", `hp/${hpId}/signature`);
          const { url } = await uploadSignatureAction(formData);
          eSignatureUrl = url;
        } catch (error) {
          console.error("Signature upload error:", error);
          toast.error(getActionErrorMessage(error, "Failed to upload signature. Please try again."));
          return;
        }
      }

      const mappedData = {
        title: values.title || null,
        name: values.name,
        suffix: values.suffix,
        workEmail: values.workEmail,
        workPhone: values.workPhone,
        philosophy: values.philosophy,
        areaOfInterest: values.areaOfInterest,
        experience: values.experience,
        hobbies: values.hobbies,
        eSignatureUrl,
        languages: values.languages.map((l) => l.name),
        specialties: values.specialties.map((s) => s.name),
        educations: values.educations.map((e) => e.name),
        certifications: values.certifications.map((c) => c.name),
        fields: values.fields.map((f) => f.name),
        affiliations: values.affiliations.map((a) => a.name),
        healthcareProviderId: hpId,
      };

      toast.promise(
        upsertHPAction({
          where: { id: profileId },
          create: mappedData,
          update: mappedData,
        }),
        {
          loading: signatureFile ? "Uploading signature and saving profile..." : "Saving profile...",
          success: (res) => {
            if (res) {
              setProfileId(res.id);
              form.reset(values);
              setSignatureFile(null);
              const fileInput = document.getElementById("signature-file") as HTMLInputElement;
              if (fileInput) fileInput.value = "";
            }
            return signatureFile ? "Profile and signature saved successfully!" : "Profile updated successfully.";
          },
          error: "Failed to update profile.",
        }
      );
    })();
  };

  return (
    <Form {...form}>
      <form action={action} className="space-y-8 w-full">
        {/* Name & Title */}
        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="basis-1/4 flex-grow">
                <FormLabel>Title / Prefix</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === NO_TITLE_VALUE ? "" : val)}
                  value={field.value || NO_TITLE_VALUE}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a title (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Select Your Title</SelectLabel>
                      <SelectItem value={NO_TITLE_VALUE}>None</SelectItem>
                      {TITLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormDescription>Optional. Displayed before your name on your public profile.</FormDescription>
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
                  <Input placeholder="Juan Dela Cruz" {...field} />
                </FormControl>
                <FormDescription>Your display name on your public profile.</FormDescription>
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
                  <Input placeholder="Jr., MD, PhD" {...field} />
                </FormControl>
                <FormDescription>Jr., Sr., III, MD, etc.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact */}
        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="workEmail"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Work Email</FormLabel>
                <FormControl>
                  <Input placeholder="example@clinic.com" {...field} />
                </FormControl>
                <FormDescription>Contact email shown on your public profile.</FormDescription>
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
                  <Input placeholder="+63 9XX XXX XXXX" {...field} />
                </FormControl>
                <FormDescription>Contact phone number shown on your public profile.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Professional Info */}
        <FormField
          control={form.control}
          name="philosophy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Philosophy of Care</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your philosophy of care..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="areaOfInterest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area of Interest</FormLabel>
              <FormControl>
                <Textarea placeholder="Your primary areas of clinical focus..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 10 years" {...field} />
              </FormControl>
              <FormDescription>How many years of experience do you have?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hobbies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hobbies</FormLabel>
              <FormControl>
                <Textarea placeholder="Your hobbies and interests..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Languages */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Languages</h3>
          <div className="flex flex-wrap gap-3">
            {languageFields.fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`languages.${index}.name`}
                render={({ field: f }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Language you speak" {...f} />
                        <Button type="button" variant="destructive" size="sm" onClick={() => languageFields.remove(index)}>
                          Remove
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => languageFields.append({ name: "" })}>
            + Add Language
          </Button>
        </div>

        <Separator />

        {/* Fields of Practice */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Fields of Practice</h3>
          <div className="flex flex-wrap gap-3">
            {fieldOfPracticeFields.fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`fields.${index}.name`}
                render={({ field: f }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Field of practice" {...f} />
                        <Button type="button" variant="destructive" size="sm" onClick={() => fieldOfPracticeFields.remove(index)}>
                          Remove
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => fieldOfPracticeFields.append({ name: "" })}>
            + Add Field of Practice
          </Button>
        </div>

        <Separator />

        {/* Specialties */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Specialties</h3>
          <div className="flex flex-wrap gap-3">
            {specialtyFields.fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`specialties.${index}.name`}
                render={({ field: f }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Specialty area" {...f} />
                        <Button type="button" variant="destructive" size="sm" onClick={() => specialtyFields.remove(index)}>
                          Remove
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => specialtyFields.append({ name: "" })}>
            + Add Specialty
          </Button>
        </div>

        <Separator />

        {/* Education */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Education</h3>
          <div className="flex flex-wrap gap-3">
            {educationFields.fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`educations.${index}.name`}
                render={({ field: f }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Degree / School" {...f} />
                        <Button type="button" variant="destructive" size="sm" onClick={() => educationFields.remove(index)}>
                          Remove
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => educationFields.append({ name: "" })}>
            + Add Education
          </Button>
        </div>

        <Separator />

        {/* Certifications */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Certifications</h3>
          <div className="flex flex-wrap gap-3">
            {certificationFields.fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`certifications.${index}.name`}
                render={({ field: f }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Certification name" {...f} />
                        <Button type="button" variant="destructive" size="sm" onClick={() => certificationFields.remove(index)}>
                          Remove
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => certificationFields.append({ name: "" })}>
            + Add Certification
          </Button>
        </div>

        <Separator />

        {/* Affiliations */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Affiliations</h3>
          <div className="flex flex-wrap gap-3">
            {affiliationFields.fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`affiliations.${index}.name`}
                render={({ field: f }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Hospital, clinic, or organization" {...f} />
                        <Button type="button" variant="destructive" size="sm" onClick={() => affiliationFields.remove(index)}>
                          Remove
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => affiliationFields.append({ name: "" })}>
            + Add Affiliation
          </Button>
        </div>

        <Separator />

        {/* E-Signature */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">E-Signature</h3>
          <p className="text-sm text-muted-foreground">
            Upload your digital signature for use on medical certificates and official documents.
          </p>
          <ESignatureUpload currentSignatureUrl={profile.eSignatureUrl} onFileChange={setSignatureFile} />
        </div>

        <Separator />

        <div className="mt-4">
          <ActionButton className="w-full" disabled={form.formState.isLoading}>
            Save Changes
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}
