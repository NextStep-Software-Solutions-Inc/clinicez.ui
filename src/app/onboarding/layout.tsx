export const metadata = {
  title: "Onboarding | Clinic EZ",
  description: "Complete your profile setup to get started with Clinic EZ",
};

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-center">
          <h1 className="text-lg font-semibold text-primary">Clinic EZ</h1>
        </div>
      </div>
      <main>{children}</main>
    </div>
  );
}
