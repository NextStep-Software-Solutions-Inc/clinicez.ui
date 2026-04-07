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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ESignatureUpload from "@/components/hp/ESignatureUpload";
import { uploadSignatureAction } from "@/actions/hp/signature-upload.action";
import { Button } from "@/components/ui/button";
import { v2ProfileSchema, type V2HPProfileType } from "../hp-v2-form.schema";
import {
  User,
  Mail,
  BookOpen,
  Languages,
  Stethoscope,
  GraduationCap,
  Award,
  Briefcase,
  Building2,
  PenLine,
  X,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ArrayFieldKey = "languages" | "specialties" | "educations" | "certifications" | "fields" | "affiliations";
type ArrayFieldName = `${ArrayFieldKey}.${number}.name`;

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

interface ArrayFieldSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  fields: { id: string }[];
  onAppend: () => void;
  addLabel: string;
  renderField: (index: number) => React.ReactNode;
}

function ArrayFieldSection({
  title,
  description,
  icon: Icon,
  fields,
  onAppend,
  addLabel,
  renderField,
}: ArrayFieldSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon size={17} />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No entries yet. Add one below.</p>
        )}
        <div className="space-y-2">
          {fields.map((_, index) => renderField(index))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAppend}
          className="gap-1.5 mt-1"
        >
          <Plus size={14} />
          {addLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

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
        title: values.title || undefined,
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

  const renderInlineField = (
    fieldName: string,
    index: number,
    placeholder: string,
    onRemove: () => void,
    formFieldName: ArrayFieldName
  ) => (
    <FormField
      key={fieldName}
      control={form.control}
      name={formFieldName}
      render={({ field: f }) => (
        <FormItem>
          <FormControl>
            <div className="flex gap-2 items-center">
              <Badge variant="secondary" className="shrink-0 text-xs px-2 py-0.5">
                {index + 1}
              </Badge>
              <Input placeholder={placeholder} {...f} className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
              >
                <X size={14} />
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form action={action} className="space-y-6 w-full">

        {/* Name & Contact Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User size={17} />
              </div>
              <div>
                <CardTitle className="text-base">Name &amp; Contact</CardTitle>
                <CardDescription className="text-xs">Your identity and contact details for your public profile.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title + Name + Suffix */}
            <div className="flex flex-col md:flex-row gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:w-36 shrink-0">
                    <FormLabel>Title</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === NO_TITLE_VALUE ? "" : val)}
                      value={field.value || NO_TITLE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Title</SelectLabel>
                          <SelectItem value={NO_TITLE_VALUE}>None</SelectItem>
                          {TITLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="suffix"
                render={({ field }) => (
                  <FormItem className="md:w-36 shrink-0">
                    <FormLabel>Suffix</FormLabel>
                    <FormControl>
                      <Input placeholder="MD, PhD, Jr." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Work Email + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="workEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Mail size={13} className="text-muted-foreground" />
                      Work Email
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="example@clinic.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+63 9XX XXX XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Bio Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen size={17} />
              </div>
              <div>
                <CardTitle className="text-base">Professional Bio</CardTitle>
                <CardDescription className="text-xs">Share your professional background and philosophy of care.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 10 years" {...field} />
                  </FormControl>
                  <FormDescription>How many years of clinical experience do you have?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="philosophy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Philosophy of Care</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Describe your philosophy of care..." {...field} />
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
                    <Textarea rows={3} placeholder="Your primary areas of clinical focus..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hobbies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hobbies &amp; Interests</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Your hobbies and interests outside of work..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Languages */}
        <ArrayFieldSection
          title="Languages"
          description="Languages you can communicate with patients in."
          icon={Languages}
          fields={languageFields.fields}
          onAppend={() => languageFields.append({ name: "" })}
          addLabel="Add Language"
          renderField={(index) =>
            renderInlineField(
              languageFields.fields[index].id,
              index,
              "Language you speak",
              () => languageFields.remove(index),
              `languages.${index}.name`
            )
          }
        />

        {/* Fields of Practice */}
        <ArrayFieldSection
          title="Fields of Practice"
          description="The medical fields you practice in."
          icon={Stethoscope}
          fields={fieldOfPracticeFields.fields}
          onAppend={() => fieldOfPracticeFields.append({ name: "" })}
          addLabel="Add Field of Practice"
          renderField={(index) =>
            renderInlineField(
              fieldOfPracticeFields.fields[index].id,
              index,
              "Field of practice",
              () => fieldOfPracticeFields.remove(index),
              `fields.${index}.name`
            )
          }
        />

        {/* Specialties */}
        <ArrayFieldSection
          title="Specialties"
          description="Your clinical specializations and areas of expertise."
          icon={Award}
          fields={specialtyFields.fields}
          onAppend={() => specialtyFields.append({ name: "" })}
          addLabel="Add Specialty"
          renderField={(index) =>
            renderInlineField(
              specialtyFields.fields[index].id,
              index,
              "Specialty area",
              () => specialtyFields.remove(index),
              `specialties.${index}.name`
            )
          }
        />

        {/* Education */}
        <ArrayFieldSection
          title="Education"
          description="Your academic degrees and institutions."
          icon={GraduationCap}
          fields={educationFields.fields}
          onAppend={() => educationFields.append({ name: "" })}
          addLabel="Add Education"
          renderField={(index) =>
            renderInlineField(
              educationFields.fields[index].id,
              index,
              "Degree / School",
              () => educationFields.remove(index),
              `educations.${index}.name`
            )
          }
        />

        {/* Certifications */}
        <ArrayFieldSection
          title="Certifications"
          description="Board certifications and professional licenses."
          icon={Briefcase}
          fields={certificationFields.fields}
          onAppend={() => certificationFields.append({ name: "" })}
          addLabel="Add Certification"
          renderField={(index) =>
            renderInlineField(
              certificationFields.fields[index].id,
              index,
              "Certification name",
              () => certificationFields.remove(index),
              `certifications.${index}.name`
            )
          }
        />

        {/* Affiliations */}
        <ArrayFieldSection
          title="Affiliations"
          description="Hospitals, clinics, or organizations you are affiliated with."
          icon={Building2}
          fields={affiliationFields.fields}
          onAppend={() => affiliationFields.append({ name: "" })}
          addLabel="Add Affiliation"
          renderField={(index) =>
            renderInlineField(
              affiliationFields.fields[index].id,
              index,
              "Hospital, clinic, or organization",
              () => affiliationFields.remove(index),
              `affiliations.${index}.name`
            )
          }
        />

        {/* E-Signature */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PenLine size={17} />
              </div>
              <div>
                <CardTitle className="text-base">E-Signature</CardTitle>
                <CardDescription className="text-xs">
                  Upload your digital signature for use on medical certificates and official documents.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ESignatureUpload currentSignatureUrl={profile.eSignatureUrl} onFileChange={setSignatureFile} />
          </CardContent>
        </Card>

        <ActionButton className="w-full" disabled={form.formState.isLoading}>
          Save Changes
        </ActionButton>
      </form>
    </Form>
  );
}
