import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Sign in to Clinic EZ
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back! Please sign in to your account.
        </p>
      </div>
      <SignIn
        signUpUrl="/sign-up"
        forceRedirectUrl="/?signin=1"
      />
    </div>
  );
}
