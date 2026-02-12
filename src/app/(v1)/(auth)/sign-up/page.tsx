import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Create your Clinic EZ account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Join thousands of healthcare professionals using Clinic EZ.
        </p>
      </div>
      <SignUp
        signInUrl="/sign-in"
      />
    </div>
  );
}
