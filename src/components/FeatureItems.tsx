"use client";

import React from "react";
import { motion } from "framer-motion"
import Each from "@components/utils/Each";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Link from "next/link";
import { Button } from "@components/ui/button";
import ConditionalRender from "./utils/ConditionalRender";
import { ArrowRightCircle, Rocket } from "lucide-react";
import Image from "next/image";
import heroImage from "@public/assets/hero-img-1.png";
import { cn } from "@lib/utils";

const topFeature = [
  {
    name: "Appointment Booking",
    description: "Book appointments from anywhere, anytime. It's that easy!",
    content: "Skip the wait, see your doctor anytime. Book appointments 24/7 with Clinic EZ.",
    image: "/assets/booking.svg",
    action: {
      label: "Schedule Appointment ➡️",
      path: "/organizations"
    }
  },
  {
    name: "Dynamic Workflow",
    description: "Tailor your clinic, your way.",
    content: "Perfect matches for patients & providers. Build trust, customize workflows, streamline care.",
    image: "/assets/user_flow.svg",
    action: {
      label: "Learn More About Customization ✏️",
      path: "/contact-us"
    }
  },
  {
    name: "Showcase Your Expertise",
    description: "Build your profile and connect with patients.",
    content: "Matching patients with the perfect fit. Build your trusted profile & connect with patients seeking your expertise.",
    image: "/assets/personal_information.svg",
    action: {
      label: "I'm a Healthcare Provider✅",
      path: "/hp/apply"
    }
  }
]
export default function FeatureItems() {
  return (
    <div className="">
      <Each
        of={topFeature}
        render={(feature, i) => (
          <motion.div 
            initial={{ opacity: 0, x: 300 * (i % 2 === 0 ? -1: 1) }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5, type: "spring", bounce: 0.5,damping: 10, stiffness: 100 }}
            className={cn("from-primary to-teal-50 p-24",
              i % 2 === 0 ? "bg-gradient-to-bl" : "bg-gradient-to-br"
            )}>
            <div className={cn("container grid grid-cols-1 lg:grid-cols-2 gap-5 items-center px-10 mx-auto")}>
              <div className={cn("flex-1 min-w-64 space-y-2 text-center lg:text-left order-last",
                i % 2 === 0 ? "text-gray-700 lg:order-first" : "text-white lg:order-last"
              )}>
                <h2 className="text-3xl font-bold ">{feature.name}</h2>
                <p className="text-gray-800">{feature.description}</p>
                <p className="text-gray-800">{feature.content}</p>
                <Link href={feature.action.path} target="_blank">
                  <Button size="lg" className="mt-8 mx-auto ~text-xs/sm ~h-8/10">
                    {feature.action.label}
                    <ArrowRightCircle className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="mx-auto">
                <Image src={feature.image} alt="Hero Image" className="object-scale-down max-w-80 " width={500} height={500} />
              </div>
            </div>
          </motion.div>
        )}
      />
    </div>
  );
}

export const HeroTitle = ({authenticated = false}) => {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 1, delay: 0.5}}
    >
      <p className="text-center lg:text-left text-6xl font-extrabold tracking-wider text-gray-500">Optimized Healthcare Management System</p>
      
      <ConditionalRender condition={!authenticated}>
        <div className="flex md:block items-center flex-col">
          <Link href="/tenants/register">
            <Button size="lg" className="mt-8 mx-auto text-sm h-10">
              Register your clinic now
              <ArrowRightCircle className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </ConditionalRender>
      <ConditionalRender condition={authenticated}>
        <div className="flex lg:block justify-center">
          <Link href="/organizations">
            <Button className="mx-auto h-10 mt-10"><Rocket size={18} className="mr-1"/>Get Started</Button>
          </Link>
        </div>
      </ConditionalRender>
    </motion.div>
  )
}

export const HeroImage = () => {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      initial={{ opacity: 0, x: "100%" }}
      transition={{ duration: 2, type:"spring", bounce:0.5 }}
    
      className="absolute bottom-0 right-0 ~w-[30rem]/[35rem]">
      <motion.div className="bg-clip-content bg-teal-500 rounded-t-full absolute bottom-0 right-0 w-full h-1/2"></motion.div>
      <Image 
        width={700}
        height={700}
        className="w-full max-h-[50rem] hidden lg:block relative" 
        src={heroImage} alt="clinic-ez-mini-logo" 
      />
    </motion.div>
  )
}