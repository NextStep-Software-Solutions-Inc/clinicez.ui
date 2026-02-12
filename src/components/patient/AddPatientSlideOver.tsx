'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Heart, 
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { createPatientShellAccount } from '@/actions/onboarding/patient-onboarding.action';
import { BloodType } from '@prisma/client';
import { format } from 'date-fns';

// Validation schemas
const essentialInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Gender is required' }),
  mobile: z.string().min(10, 'Valid phone number is required'),
});

const additionalInfoSchema = z.object({
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  nickname: z.string().optional(),
  placeOfBirth: z.string().optional(),
  civilStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED']).optional(),
  bloodType: z.string().optional(),
  telephone: z.string().optional(),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  conditions: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
});

type EssentialInfo = z.infer<typeof essentialInfoSchema>;
type AdditionalInfo = z.infer<typeof additionalInfoSchema>;

interface AddPatientSlideOverProps {
  clinicId: number;
  createdBy: number;
  trigger?: React.ReactNode;
}

export default function AddPatientSlideOver({
  clinicId,
  createdBy,
  trigger,
}: AddPatientSlideOverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Form for essential info
  const essentialForm = useForm<EssentialInfo>({
    resolver: zodResolver(essentialInfoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dob: '',
      gender: undefined,
      mobile: '',
    },
  });

  // Form for additional info
  const additionalForm = useForm<AdditionalInfo>({
    resolver: zodResolver(additionalInfoSchema),
    defaultValues: {
      middleName: '',
      suffix: '',
      nickname: '',
      placeOfBirth: '',
      civilStatus: undefined,
      bloodType: '',
      telephone: '',
      religion: '',
      nationality: '',
      conditions: '',
      allergies: '',
      medications: '',
    },
  });

  const progress = (step / 3) * 100;

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await essentialForm.trigger();
      if (isValid) {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    const essentialData = essentialForm.getValues();
    const additionalData = additionalForm.getValues();

    setIsSubmitting(true);

    try {
      const result = await createPatientShellAccount({
        clinicId,
        createdBy,
        patientData: {
          firstName: essentialData.firstName,
          lastName: essentialData.lastName,
          middleName: additionalData.middleName || null,
          suffix: additionalData.suffix || null,
          nickname: additionalData.nickname || null,
          email: essentialData.email,
          mobile: essentialData.mobile,
          telephone: additionalData.telephone || null,
          dob: new Date(essentialData.dob),
          gender: essentialData.gender,
          placeOfBirth: additionalData.placeOfBirth || null,
          civilStatus: additionalData.civilStatus || null,
          bloodType: additionalData.bloodType && additionalData.bloodType in BloodType 
            ? (additionalData.bloodType as BloodType) 
            : null,
          religion: additionalData.religion || null,
          nationality: additionalData.nationality || null,
        },
        healthRecords: {
          conditions: additionalData.conditions || null,
          allergies: additionalData.allergies || null,
          medications: additionalData.medications || null,
          medicalHistory: null,
        },
      });

      if (result.success) {
        toast.success('Patient added successfully!');
        setIsOpen(false);
        essentialForm.reset();
        additionalForm.reset();
        setStep(1);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add patient');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    essentialForm.reset();
    additionalForm.reset();
    setStep(1);
  };

  const essentialData = essentialForm.watch();
  const additionalData = additionalForm.watch();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">Add New Patient</SheetTitle>
            <SheetDescription className="text-base">
              {step === 1 && 'Enter essential patient information'}
              {step === 2 && 'Add optional details and medical information'}
              {step === 3 && 'Review and confirm patient details'}
            </SheetDescription>
          </SheetHeader>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Step {step} of 3
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-6">
            {/* Step 1: Essential Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <User className="h-4 w-4" />
                    Personal Information
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        {...essentialForm.register('firstName')}
                      />
                      {essentialForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive">
                          {essentialForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        {...essentialForm.register('lastName')}
                      />
                      {essentialForm.formState.errors.lastName && (
                        <p className="text-sm text-destructive">
                          {essentialForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        className="pl-10"
                        {...essentialForm.register('email')}
                      />
                    </div>
                    {essentialForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {essentialForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                        {...essentialForm.register('mobile')}
                      />
                    </div>
                    {essentialForm.formState.errors.mobile && (
                      <p className="text-sm text-destructive">
                        {essentialForm.formState.errors.mobile.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Calendar className="h-4 w-4" />
                    Demographics
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      {...essentialForm.register('dob')}
                    />
                    {essentialForm.formState.errors.dob && (
                      <p className="text-sm text-destructive">
                        {essentialForm.formState.errors.dob.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <RadioGroup
                      value={essentialData.gender}
                      onValueChange={(value) => essentialForm.setValue('gender', value as 'MALE' | 'FEMALE')}
                    >
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-accent">
                          <RadioGroupItem value="MALE" id="male" />
                          <Label htmlFor="male" className="flex-1 cursor-pointer">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-accent">
                          <RadioGroupItem value="FEMALE" id="female" />
                          <Label htmlFor="female" className="flex-1 cursor-pointer">Female</Label>
                        </div>
                      </div>
                    </RadioGroup>
                    {essentialForm.formState.errors.gender && (
                      <p className="text-sm text-destructive">
                        {essentialForm.formState.errors.gender.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Additional Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <FileText className="h-4 w-4" />
                    Additional Details
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        placeholder="Optional"
                        {...additionalForm.register('middleName')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="suffix">Suffix</Label>
                      <Input
                        id="suffix"
                        placeholder="Jr., Sr., III"
                        {...additionalForm.register('suffix')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname/Preferred Name</Label>
                    <Input
                      id="nickname"
                      placeholder="What they prefer to be called"
                      {...additionalForm.register('nickname')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="civilStatus">Civil Status</Label>
                      <Select
                        value={additionalData.civilStatus}
                        onValueChange={(value) => additionalForm.setValue('civilStatus', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="MARRIED">Married</SelectItem>
                          <SelectItem value="DIVORCED">Divorced</SelectItem>
                          <SelectItem value="WIDOWED">Widowed</SelectItem>
                          <SelectItem value="SEPARATED">Separated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bloodType">Blood Type</Label>
                      <Select
                        value={additionalData.bloodType}
                        onValueChange={(value) => additionalForm.setValue('bloodType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
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
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirth">Place of Birth</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="placeOfBirth"
                          placeholder="City, Country"
                          className="pl-10"
                          {...additionalForm.register('placeOfBirth')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        placeholder="e.g., Filipino"
                        {...additionalForm.register('nationality')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="religion">Religion</Label>
                      <Input
                        id="religion"
                        placeholder="Optional"
                        {...additionalForm.register('religion')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephone">Telephone</Label>
                      <Input
                        id="telephone"
                        type="tel"
                        placeholder="Home/Office number"
                        {...additionalForm.register('telephone')}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Heart className="h-4 w-4" />
                    Medical Information (Optional)
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conditions">Known Conditions</Label>
                    <Textarea
                      id="conditions"
                      placeholder="List any existing medical conditions..."
                      rows={3}
                      {...additionalForm.register('conditions')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      placeholder="List any known allergies..."
                      rows={3}
                      {...additionalForm.register('allergies')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medications">Current Medications</Label>
                    <Textarea
                      id="medications"
                      placeholder="List any current medications..."
                      rows={3}
                      {...additionalForm.register('medications')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Review Patient Information</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please review the information below before creating the patient record.
                  </p>
                </div>

                {/* Essential Info Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Personal Information</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(1)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {essentialData.firstName} {essentialData.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{essentialData.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="font-medium">{essentialData.mobile}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date of Birth:</span>
                      <span className="font-medium">
                        {essentialData.dob ? format(new Date(essentialData.dob), 'PPP') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="font-medium capitalize">
                        {essentialData.gender?.toLowerCase() || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Info Summary */}
                {(additionalData.middleName || additionalData.bloodType || additionalData.civilStatus) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Additional Details</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep(2)}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      {additionalData.middleName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Middle Name:</span>
                          <span className="font-medium">{additionalData.middleName}</span>
                        </div>
                      )}
                      {additionalData.bloodType && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Blood Type:</span>
                          <Badge variant="secondary">{additionalData.bloodType.replace('_', '')}</Badge>
                        </div>
                      )}
                      {additionalData.civilStatus && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Civil Status:</span>
                          <span className="font-medium capitalize">{additionalData.civilStatus.toLowerCase()}</span>
                        </div>
                      )}
                      {additionalData.nationality && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Nationality:</span>
                          <span className="font-medium">{additionalData.nationality}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical Info Summary */}
                {(additionalData.conditions || additionalData.allergies || additionalData.medications) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Medical Information</h4>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {additionalData.conditions && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Conditions:</p>
                          <p className="text-sm">{additionalData.conditions}</p>
                        </div>
                      )}
                      {additionalData.allergies && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Allergies:</p>
                          <p className="text-sm">{additionalData.allergies}</p>
                        </div>
                      )}
                      {additionalData.medications && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Current Medications:</p>
                          <p className="text-sm">{additionalData.medications}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={step === 1 ? handleCancel : handleBack}
              disabled={isSubmitting}
            >
              {step === 1 ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </>
              )}
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Patient
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
