import SelectHPType from "./components/SelectHPType";
import SelectPlan from "./components/SelectPlan";
import PaymentForm from "./components/PaymentForm";
import ConfirmationForm from "./components/ConfirmationForm";

import { Metadata } from "next";
import HPApplicationDataProvider from "@contexts/hp-application.context";
import ApplicationForm from "./components/ApplicationForm";
import React from "react";
import { getHPsAction } from "@actions/hp.actions";
import { getCachedSession } from "@actions/session.action";
import { AppRouterPageRouteOpts } from "@/types";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Healthcare Provider Registration",
  description: "Register as a healthcare provider",
}

export default async function HealthcareProviderRegistrationPage(props: AppRouterPageRouteOpts) {
  const session = await getCachedSession();
  
  const hps = await getHPsAction({userId: session?.user.sub});
  
  // Check if user already has an HP profile (only one is allowed per user)
  const hasExistingHP = hps && hps.length > 0;
  
  if (hasExistingHP) {
    return (
      <div className="container mx-auto my-10">
        <div className="prose max-w-full text-center">
          <h1>Healthcare Provider Application</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
            <h2 className="text-yellow-800 mt-0">You Already Have a Healthcare Provider Profile</h2>
            <p className="text-yellow-700">
              Our system only allows one Healthcare Provider profile per user. 
              You already have an existing profile as a <strong>{hps[0].HPType.name}</strong>.
            </p>
            <p className="text-yellow-700">
              If you need to change your Healthcare Provider type or update your profile, 
              please contact our support team.
            </p>
            <div className="mt-4">
              <Link 
                href="/hp" 
                className="inline-block bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 no-underline"
              >
                View Healthcare Providers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <HPApplicationDataProvider>
      <div className="container mx-auto my-10">
        <div className="prose max-w-full">
          <h1>Healthcare Provider Application Process</h1>
          <p>
            Thank you for your interest in joining our network of healthcare providers! This online application process will
            guide you through the steps of becoming a Clinic EZ provider.
          </p>
        </div>
        <ApplicationForm currentStep={1} >
          <SelectHPType />
          <SelectPlan/>
          <PaymentForm />
          <ConfirmationForm />
        </ApplicationForm>
      </div>
    </HPApplicationDataProvider>
  );
}