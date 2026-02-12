"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, User as UserIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updatePatientProfile } from "@/actions/patients/patient-details.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { BloodType } from "@prisma/client";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().nullable().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().nullable().optional(),
  nickname: z.string().nullable().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).nullable().optional(),
  mobile: z.string().min(1, "Mobile number is required"),
  telephone: z.string().nullable().optional(),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  placeOfBirth: z.string().nullable().optional(),
  civilStatus: z.string().nullable().optional(),
  bloodType: z.string().nullable().optional(),
  religion: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileTabProps {
  patientId: number;
  clinicId: number;
  userId: number;
  patientData: {
    onboardingStatus: string | null;
    addedBy: number | null;
    Patient: {
      id: number;
      firstName: string | null;
      middleName: string | null;
      lastName: string | null;
      suffix: string | null;
      nickname: string | null;
      email: string | null;
      mobile: string | null;
      telephone: string | null;
      dob: Date | null;
      gender: string | null;
      placeOfBirth: string | null;
      civilStatus: string | null;
      bloodType: string | null;
      religion: string | null;
      nationality: string | null;
      onboardingStatus: string | null;
      isShellAccount: boolean | null;
      shellAccountCreatedBy: number | null;
      profileCompletionDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    addedByUser?: {
      id: number;
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  canEdit: boolean;
}

export default function ProfileTab({ patientId, clinicId, userId, patientData, canEdit }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const user = patientData.Patient;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      middleName: user?.middleName || "",
      lastName: user?.lastName || "",
      suffix: user?.suffix || "",
      nickname: user?.nickname || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
      telephone: user?.telephone || "",
      dob: user?.dob ? format(new Date(user.dob), "yyyy-MM-dd") : "",
      gender: user?.gender || "",
      placeOfBirth: user?.placeOfBirth || "",
      civilStatus: user?.civilStatus || "",
      bloodType: user?.bloodType || "",
      religion: user?.religion || "",
      nationality: user?.nationality || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updatePatientProfile({
        patientId,
        clinicId,
        userId,
        profileData: {
          firstName: data.firstName,
          middleName: data.middleName || null,
          lastName: data.lastName,
          suffix: data.suffix || null,
          nickname: data.nickname || null,
          email: data.email || undefined,
          mobile: data.mobile,
          telephone: data.telephone || null,
          dob: new Date(data.dob),
          gender: data.gender,
          placeOfBirth: data.placeOfBirth || null,
          civilStatus: data.civilStatus || null,
          bloodType: data.bloodType && data.bloodType in BloodType ? data.bloodType : null,
          religion: data.religion || null,
          nationality: data.nationality || null,
        },
      });

      if (result.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No user data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with status badges */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserIcon className="h-6 w-6" />
                Patient Profile
              </CardTitle>
              <CardDescription>
                View and manage patient profile information
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {user.isShellAccount && (
                <Badge variant="outline" className="border-amber-500 text-amber-700">
                  Shell Account
                </Badge>
              )}
              {user.onboardingStatus && (
                <Badge variant={user.onboardingStatus === "COMPLETED" ? "default" : "secondary"}>
                  {user.onboardingStatus}
                </Badge>
              )}
              {canEdit && !isEditing && (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={handleSubmit(onSubmit)} size="sm" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} size="sm" variant="outline" disabled={isSubmitting}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium">{user.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                {isEditing ? (
                  <Input
                    id="middleName"
                    {...register("middleName")}
                    placeholder="Enter middle name"
                  />
                ) : (
                  <p className="text-sm font-medium">{user.middleName || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium">{user.lastName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix</Label>
                {isEditing ? (
                  <Input
                    id="suffix"
                    {...register("suffix")}
                    placeholder="Jr., Sr., III"
                  />
                ) : (
                  <p className="text-sm font-medium">{user.suffix || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                {isEditing ? (
                  <Input
                    id="nickname"
                    {...register("nickname")}
                    placeholder="Enter nickname"
                  />
                ) : (
                  <p className="text-sm font-medium">{user.nickname || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="email@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium">{user.email ?? "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">
                  Mobile <span className="text-red-500">*</span>
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="mobile"
                      {...register("mobile")}
                      placeholder="+63 XXX XXX XXXX"
                    />
                    {errors.mobile && (
                      <p className="text-sm text-red-500">{errors.mobile.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium">{user.mobile || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone</Label>
                {isEditing ? (
                  <Input
                    id="telephone"
                    {...register("telephone")}
                    placeholder="Enter telephone"
                  />
                ) : (
                  <p className="text-sm font-medium">{user.telephone || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="dob"
                      type="date"
                      {...register("dob")}
                    />
                    {errors.dob && (
                      <p className="text-sm text-red-500">{errors.dob.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium">
                    {user.dob ? format(new Date(user.dob), "MMMM d, yyyy") : "-"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </Label>
                {isEditing ? (
                  <>
                    <Select
                      value={watch("gender")}
                      onValueChange={(value) => setValue("gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-red-500">{errors.gender.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium">{user.gender || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                {isEditing ? (
                  <Select
                    value={watch("bloodType") || ""}
                    onValueChange={(value) => setValue("bloodType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A_POSITIVE">A+</SelectItem>
                      <SelectItem value="A_NEGATIVE">A-</SelectItem>
                      <SelectItem value="B_POSITIVE">B+</SelectItem>
                      <SelectItem value="B_NEGATIVE">B-</SelectItem>
                      <SelectItem value="AB_POSITIVE">AB+</SelectItem>
                      <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
                      <SelectItem value="O_POSITIVE">O+</SelectItem>
                      <SelectItem value="O_NEGATIVE">O-</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{user.bloodType || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="civilStatus">Civil Status</Label>
                {isEditing ? (
                  <Input
                    id="civilStatus"
                    {...register("civilStatus")}
                    placeholder="Single, Married, etc."
                  />
                ) : (
                  <p className="text-sm font-medium">{user.civilStatus || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeOfBirth">Place of Birth</Label>
                {isEditing ? (
                  <Input
                    id="placeOfBirth"
                    {...register("placeOfBirth")}
                    placeholder="Enter place of birth"
                  />
                ) : (
                  <p className="text-sm font-medium">{user.placeOfBirth || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                {isEditing ? (
                  <Input
                    id="religion"
                    {...register("religion")}
                    placeholder="Enter religion"
                  />
                ) : (
                  <p className="text-sm font-medium">{user.religion || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                {isEditing ? (
                  <Input
                    id="nationality"
                    {...register("nationality")}
                    placeholder="Enter nationality"
                  />
                ) : (
                  <p className="text-sm font-medium">{user.nationality || "-"}</p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Account status and metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Created</Label>
              <p className="text-sm font-medium">
                {format(new Date(user.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Last Updated</Label>
              <p className="text-sm font-medium">
                {format(new Date(user.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            {user.profileCompletionDate && (
              <div className="space-y-2">
                <Label>Profile Completed</Label>
                <p className="text-sm font-medium">
                  {format(new Date(user.profileCompletionDate), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}
            {patientData.addedByUser && (
              <div className="space-y-2">
                <Label>Added By</Label>
                <p className="text-sm font-medium">
                  {patientData.addedByUser.firstName} {patientData.addedByUser.lastName}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
