'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stepper, Step } from '@/components/onboarding/Stepper';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  completeUserOnboarding,
  checkShellAccount,
  upsertOnboardingStep,
} from '@/actions/onboarding/user-onboarding.action';
import { OnboardingStatus } from '@prisma/client';

// Form validation schemas
const basicInfoSchema = z.object({
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
});

const steps: Step[] = [
  {
    id: 'basic',
    title: 'Basic Info',
    description: 'Required information',
  },
  {
    id: 'additional',
    title: 'Additional Details',
    description: 'Optional information',
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Finish setup',
  },
];

interface OnboardingPageProps {
  userId: number;
  currentUser: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    dob?: Date | null;
    gender?: 'MALE' | 'FEMALE' | null;
    mobile?: string | null;
    middleName?: string | null;
    suffix?: string | null;
    nickname?: string | null;
    placeOfBirth?: string | null;
    civilStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | null;
    bloodType?: string | null;
    telephone?: string | null;
    religion?: string | null;
    nationality?: string | null;
  };
}

export default function UserOnboardingPage({ userId, currentUser }: OnboardingPageProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShellAccount, setIsShellAccount] = useState(false);
  const [shellAccountCreator, setShellAccountCreator] = useState<{
    firstName?: string | null;
    lastName?: string | null;
  } | null>(null);

  const basicForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      email: currentUser.email,
      dob: currentUser.dob ? new Date(currentUser.dob).toISOString().split('T')[0] : '',
      gender: currentUser.gender || undefined,
      mobile: currentUser.mobile || '',
    },
  });

  const additionalForm = useForm<z.infer<typeof additionalInfoSchema>>({
    resolver: zodResolver(additionalInfoSchema),
    defaultValues: {
      middleName: currentUser.middleName || '',
      suffix: currentUser.suffix || '',
      nickname: currentUser.nickname || '',
      placeOfBirth: currentUser.placeOfBirth || '',
      civilStatus: currentUser.civilStatus || undefined,
      bloodType: currentUser.bloodType || '',
      telephone: currentUser.telephone || '',
      religion: currentUser.religion || '',
      nationality: currentUser.nationality || '',
    },
  });

  useEffect(() => {
    // Check if this is a shell account
    const checkStatus = async () => {
      const result = await checkShellAccount(userId);
      if (result.success && result.data) {
        setIsShellAccount(result.data.isShellAccount);
        setShellAccountCreator(result.data.createdBy);
      }
    };
    checkStatus();
  }, [userId]);

  const handleBasicInfoNext = async (data: z.infer<typeof basicInfoSchema>) => {
    // Mark basic info step as completed
    await upsertOnboardingStep({
      userId,
      stepType: 'PROFILE',
      stepName: 'Basic Information',
      status: OnboardingStatus.COMPLETED,
      metadata: { completedAt: new Date().toISOString() },
    });
    setCurrentStep(1);
  };

  const handleAdditionalInfoNext = async (data: z.infer<typeof additionalInfoSchema>) => {
    // Mark additional info step as completed
    await upsertOnboardingStep({
      userId,
      stepType: 'PROFILE',
      stepName: 'Additional Information',
      status: OnboardingStatus.COMPLETED,
      metadata: { completedAt: new Date().toISOString() },
    });
    setCurrentStep(2);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const basicData = basicForm.getValues();
      const additionalData = additionalForm.getValues();

      const profileData = {
        ...basicData,
        ...additionalData,
        dob: new Date(basicData.dob),
      };

      const result = await completeUserOnboarding({
        userId,
        profileData,
        actorId: userId,
      });

      if (result.success) {
        toast.success('Onboarding completed successfully!');
        // Redirect to dashboard
        router.push('/');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('An error occurred while completing onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-10">
      {/* Shell Account Banner */}
      {isShellAccount && shellAccountCreator && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your account was created by{' '}
            <strong>
              {shellAccountCreator.firstName} {shellAccountCreator.lastName}
            </strong>
            . Please complete your profile to get started.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome to ClinicEZ!</h1>
        <p className="text-muted-foreground mt-2">
          Let&apos;s get your profile set up. This will only take a few minutes.
        </p>
      </div>

      {/* Stepper */}
      <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

      {/* Step Content */}
      <Card>
        {currentStep === 0 && (
          <Form {...basicForm}>
            <form onSubmit={basicForm.handleSubmit(handleBasicInfoNext)}>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Please provide your required personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={basicForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={basicForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={basicForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>Your email cannot be changed.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={basicForm.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={basicForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={basicForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+63 912 345 6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="ml-auto">
                  Next
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}

        {currentStep === 1 && (
          <Form {...additionalForm}>
            <form onSubmit={additionalForm.handleSubmit(handleAdditionalInfoNext)}>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Optional information to complete your profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={additionalForm.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Middle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={additionalForm.control}
                    name="suffix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suffix</FormLabel>
                        <FormControl>
                          <Input placeholder="Jr., Sr., III" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={additionalForm.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nickname</FormLabel>
                        <FormControl>
                          <Input placeholder="Nickname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={additionalForm.control}
                    name="placeOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place of Birth</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={additionalForm.control}
                    name="civilStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Civil Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SINGLE">Single</SelectItem>
                            <SelectItem value="MARRIED">Married</SelectItem>
                            <SelectItem value="DIVORCED">Divorced</SelectItem>
                            <SelectItem value="WIDOWED">Widowed</SelectItem>
                            <SelectItem value="SEPARATED">Separated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={additionalForm.control}
                    name="bloodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Type</FormLabel>
                        <FormControl>
                          <Input placeholder="A+, O-, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={additionalForm.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telephone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={additionalForm.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input placeholder="Filipino" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={additionalForm.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion</FormLabel>
                      <FormControl>
                        <Input placeholder="Your religion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(0)}>
                  Back
                </Button>
                <Button type="submit">Next</Button>
              </CardFooter>
            </form>
          </Form>
        )}

        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Review your information and complete the onboarding process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="font-semibold">Profile Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    {basicForm.getValues('firstName')} {basicForm.getValues('lastName')}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    {basicForm.getValues('email')}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mobile:</span>{' '}
                    {basicForm.getValues('mobile')}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>{' '}
                    {basicForm.getValues('gender')}
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  By completing your profile, you agree to provide accurate information and
                  understand that this information will be used for healthcare purposes.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Complete Onboarding'
                )}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
