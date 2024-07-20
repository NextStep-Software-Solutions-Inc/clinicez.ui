import { Metadata } from "next";
import Image from "next/image";
import heroImage from "@public/assets/hero-img-1.png";
import { Button } from "@components/ui/button";
import { ArrowRightCircle, Rocket } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";
import { getCachedSession } from "@actions/session.action";

export const metadata: Metadata = {
  title: "Home | Clinic EZ ",
  description: "Optimized Healthcare Management System",
};


const topFeature = [
  {
    name: "⏰ Appointment Booking",
    description: "Book appointments from anywhere, anytime. It's that easy!",
    content: "Skip the wait, see your doctor anytime. Book appointments 24/7 with Clinic EZ.",
    action: {
      label: "Schedule Appointment ➡️",
      path: "/contact-us"
    }
  },
  {
    name: "⚙️ Dynamic Workflow",
    description: "Tailor your clinic, your way.",
    content: "Perfect matches for patients & providers. Build trust, customize workflows, streamline care.",
    action: {
      label: "Learn More About Customization ✏️",
      path: "/contact-us"
    }
  },
  {
    name: "🤩 Showcase Your Expertise",
    description: "Build your profile and connect with patients.",
    content: "Matching patients with the perfect fit. Build your trusted profile & connect with patients seeking your expertise.",
    action: {
      label: "Join Clinic EZ ✅",
      path: "/hp/apply"
    }
  }
]
export default async function HomePage() {
  
  const session = await getCachedSession();
  const authenticated = !!session  
  return (
    <main className="flex flex-col">
      <section className="flex-1 lg:bg-gradient-to-l from-[#6DEBF4] via-[#C3FBFF] to-[#D3FCFF] bg-opacity-30">
        <div className="relative container mx-auto p-4 ~py-8/32">
          <div className="mx-auto sm:px-6 lg:px-8">
            <div className="grid items-center grid-cols-1 gap-2 lg:grid-cols-2">
              <div>
                <p className="text-center md:text-left ~text-xs/base font-semibold tracking-wider text-gray-500 uppercase">Optimized Healthcare Management System</p>
                <h1 className="text-center md:text-left ~text-2xl/6xl animate-pulse fill-mode-forwards repeat-[2] mt-4 font-bold text-transparent bg-gradient-to-r from-primary to-slate-500 bg-clip-text lg:mt-8">Welcome to Clinic 
                  {" "}
                  <span className="~text-2xl/6xl text-white rounded-3xl font-extralight px-4 leading-tight " style={{
                    background: "linear-gradient(135deg, rgba(62,236,225,1) 0%, rgba(49,205,188,1) 15%, rgba(44,171,152,1) 70%, rgba(7,167,136,1) 100%)",
                    borderRadius: "34% 66% 69% 31% / 44% 51% 49% 56%"
                  }}>ez</span>
                </h1>
                <p className="relative z-10 text-center md:text-left ~text-sm/base mt-4 text-gray-600 lg:mt-8">
                  The innovative platform revolutionizing healthcare connections.<br/>Our user-friendly interface empowers healthcare providers to streamline appointment management, while giving patients effortless access to book consultations with their preferred professionals. Experience the future of healthcare with Clinic EZ — where convenience meets care.
                </p>
                <ConditionalRender condition={!authenticated}>
                  <div className="flex md:block items-center flex-col">
                    <Link href="/api/auth/login">
                      <Button size="lg" className="rounded-full mt-8 mx-auto ~text-xs/sm ~h-8/10">
                        Join for free
                        <ArrowRightCircle className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <p className="mt-5 ~text-sm/base text-gray-600">Already joined us?
                      <Link href="/api/auth/login" title="" className="text-black hover:underline">Log in</Link>
                    </p>
                  </div>
                </ConditionalRender>
                <ConditionalRender condition={authenticated}>
                  <div className="flex md:block">
                    <Button className="mx-auto ~text-xs/sm ~h-8/10 rounded-full mt-10"><Rocket size={18} className="mr-1"/>Get Started</Button>
                  </div>
                </ConditionalRender>
              </div>

              <div className="absolute bottom-0 right-0 ~w-[30rem]/[40rem]">
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
      <section className="bg-slate-100 flex-1 flex items-center ~py-2/16">
        <div className="p-2 container flex justify-center flex-wrap ~gap-5/16 text-center">
          <Each
            of={topFeature}
            render={(feature) => (
              <Card className="relative basis-[20rem] flex-grow shadow-xl hover:scale-105 hover:z-10 transition-all rounded-2xl">
                <CardHeader>
                  <CardTitle className="~text-sm/xl uppercase tracking-wider text-primary">{feature.name}</CardTitle>
                  <CardDescription className="~text-xs/sm">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="~text-sm/base mb-16 text-gray-600">{feature.content}</CardContent>
                <CardFooter className="absolute bottom-0 w-full">
                  <Link href={feature.action.path} className="w-full">
                    <Button className="~text-xs/sm ~h-8/10 w-full rounded-full hover:animate-pulse">{feature.action.label}</Button>
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
