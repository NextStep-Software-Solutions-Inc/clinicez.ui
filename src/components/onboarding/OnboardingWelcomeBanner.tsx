"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import Link from "next/link";

const TIPS = [
  {
    title: "Complete Your Profile",
    description:
      "Add more details to your profile to get the most out of Clinic EZ.",
    href: "/settings",
    icon: "👤",
  },
  {
    title: "Explore Your Dashboard",
    description:
      "View your appointments, medical records, and more from your dashboard.",
    href: "/",
    icon: "📊",
  },
  {
    title: "Connect With Your Clinic",
    description:
      "Link with your healthcare provider to access your medical records.",
    href: "/",
    icon: "🏥",
  },
];

export default function OnboardingWelcomeBanner() {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const showBanner = searchParams.get("onboarding") === "complete" && !dismissed;

  if (!showBanner) return null;

  return (
    <div className="mb-6 space-y-4">
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="relative py-6">
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-4 top-4 rounded-full p-1 hover:bg-emerald-100"
            aria-label="Close welcome banner"
          >
            <X className="h-4 w-4 text-emerald-600" />
          </button>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-6 w-6 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-emerald-800">
                You&apos;re all set! 🎉
              </h3>
              <p className="mt-1 text-sm text-emerald-700">
                Your profile has been set up successfully. Here are some things
                you can do next:
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {TIPS.map((tip) => (
              <Link
                key={tip.title}
                href={tip.href}
                className="group flex items-start gap-3 rounded-lg border border-emerald-200 bg-white p-3 transition-all hover:border-emerald-300 hover:shadow-sm"
              >
                <span className="text-xl">{tip.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-emerald-800 group-hover:text-emerald-900">
                    {tip.title}
                  </h4>
                  <p className="mt-0.5 text-xs text-emerald-600 line-clamp-2">
                    {tip.description}
                  </p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
