import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import UserOnboardingPage from '@/components/onboarding/UserOnboardingPage';
import { OnboardingStatus } from '@prisma/client';

export default async function OnboardingPage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect('/sign-in');
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { userId: clerkUserId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      middleName: true,
      suffix: true,
      nickname: true,
      dob: true,
      gender: true,
      mobile: true,
      telephone: true,
      placeOfBirth: true,
      civilStatus: true,
      bloodType: true,
      religion: true,
      nationality: true,
      onboardingStatus: true,
      isShellAccount: true,
    },
  });

  if (!user) {
    // User doesn't exist in database yet
    redirect('/');
  }

  // If onboarding is already complete, redirect to home
  if (user.onboardingStatus === OnboardingStatus.COMPLETED) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <UserOnboardingPage userId={user.id} currentUser={user} />
    </div>
  );
}
