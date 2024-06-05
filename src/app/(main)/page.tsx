import { Metadata } from "next";
import Image from "next/image";
import heroImage from "@public/assets/hero-img-1.png";
import { Button } from "@components/ui/button";
import { ArrowRightCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { getSession } from "@auth0/nextjs-auth0";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";

export const metadata: Metadata = {
  title: "Home | Clinic EZ ",
  description: "Optimized Healthcare Management System",
};


const topFeature = [
  {
    name: "⏰ Appointment Booking",
    description: "Book appointments from anywhere, anytime. It's that easy!",
    content: "Gone are the days of waiting on hold or juggling schedules.  Clinic EZ allows you to book appointments with your doctor 24/7, from the comfort of your own home or on the go.  Simply choose a time that works for you and confirm your appointment in just a few clicks.",
    action: {
      label: "Schedule Appointment ➡️",
      path: ""
    }
  },
  {
    name: "⚙️ Dynamic Workflow",
    description: "Tailor your clinic, your way.",
    content: "Clinic EZ understands that every organization has its own unique needs.  Our dynamic workflow feature empowers you to customize your clinic's appointment flow, from scheduling preferences to intake forms.  This flexibility allows you to streamline your operations and provide a seamless experience for both your staff and patients.",
    action: {
      label: "Learn More About Customization ✏️",
      path: ""
    }
  },
  {
    name: "🤩 Showcase Your Expertise",
    description: "Build your profile and connect with patients.",
    content: "Clinic EZ doesn't just connect patients with appointments – it connects them with the right healthcare providers.   Build a comprehensive professional profile that showcases your expertise, experience, and qualifications.  Let potential patients discover you and get the care they deserve.",
    action: {
      label: "Join Clinic EZ ✅",
      path: ""
    }
  }
]
export default async function HomePage() {
  
  const session = await getSession();
  const authenticated = !!session  
  return (
    <main className="content flex flex-col">
      <section className="bg-gradient-to-l from-[#6DEBF4] via-[#C3FBFF] to-[#D3FCFF] bg-opacity-30">
        <div className="relative container mx-auto p-2 sm:py-16 lg:py-32">
          <div className="mx-auto sm:px-6 lg:px-8">
            <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
              <div>
                <p className="text-base font-semibold tracking-wider text-gray-500 uppercase">Optimized Healthcare Management System</p>
                <h1 className="mt-4 text-4xl font-bold text-primary lg:mt-8 sm:text-6xl xl:text-8xl">Revitalize in an <span className="text-white rounded-3xl font-extralight text-7xl px-4 leading-tight" style={{
                  background: "linear-gradient(135deg, rgba(62,236,225,1) 0%, rgba(49,205,188,1) 15%, rgba(44,171,152,1) 70%, rgba(7,167,136,1) 100%)",
                  borderRadius: "34% 66% 69% 31% / 44% 51% 49% 56%"
                }} >ez</span> way.</h1>
                <p className="mt-4 text-base text-gray-600 lg:mt-8 sm:text-xl">Join Health Organization and Manage Your Health Records</p>
                <ConditionalRender condition={!authenticated}>
                  <Link href="/api/auth/login">
                    <Button size="lg" className="rounded-full mt-8">
                  Join for free
                      <ArrowRightCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <p className="mt-5 text-gray-600">Already joined us?
                    <Link href="/api/auth/login" title="" className="text-black  hover:underline">Log in</Link>
                  </p>
                </ConditionalRender>
                <ConditionalRender condition={authenticated}>
                  <Button className="rounded-full mt-10">Book an Appointment</Button>
                </ConditionalRender>
              </div>

              <div className="absolute bottom-0 right-0 w-[40rem]">
                <div className="bg-clip-content bg-teal-500 rounded-t-full absolute bottom-0 right-0 w-full h-1/2"></div>
                <Image 
                  width={700}
                  height={700}
                  className="w-full max-h-[50rem] hidden lg:block relative" 
                  src={heroImage} alt="clinic-ez-mini-logo" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-slate-200 flex-1 flex items-center py-5">
        <div className="container flex justify-center flex-wrap gap-5 text-center">
          <Each
            of={topFeature}
            render={(feature) => (
              <Card className="relative basis-[20rem] flex-grow shadow-xl hover:scale-105 hover:z-50 transition-all rounded-3xl">
                <CardHeader>
                  <CardTitle className="uppercase tracking-wider">{feature.name}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="mb-16">{feature.content}</CardContent>
                <CardFooter className="absolute bottom-0 w-full">
                  <Link href={feature.action.path} className="w-full">
                    <Button className="w-full rounded-full hover:animate-pulse">{feature.action.label}</Button>
                  </Link>
                </CardFooter>
              </Card>
            )}
          />
        </div>
      </section>
    </main>
  );
}
