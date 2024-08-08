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
const MotionCard = motion(Card)
export default function FeatureItems() {
  return (
    <motion.ul 
      initial="initial"
      whileInView="inView"
      transition={{ staggerChildren: 0.3, duration: 2, type:"spring", bounce:0.5 }}
      className="p-2 container flex justify-center flex-wrap ~gap-5/16 text-center">
      <Each
        of={topFeature}
        render={(feature, i) => (
          <MotionCard 
            variants={{
              initial: { opacity: 0, y: "100%" },
              inView: { opacity: 1, y: 0  }}
            }
            whileHover={{ scale: 1.1, zIndex: 10}}
            className="relative basis-[20rem] flex-grow shadow-xl rounded-2xl">
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
          </MotionCard>
        )}
      />
    </motion.ul>
  );
}



export const HeroTitle = ({authenticated = false}) => {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      initial={{ opacity: 0, x: "-100%" }}
      transition={{ duration: 2, type:"spring", bounce:0.5 }}
    >
      <p className="text-center md:text-left ~text-xs/base font-semibold tracking-wider text-gray-500 uppercase">Optimized Healthcare Management System</p>
      <motion.h1 
        initial="initial"
        animate="animate"
        transition={{ staggerChildren: 0.15 }}
        className="text-center md:text-left ~text-2xl/6xl mt-4 font-bold lg:mt-8 text-primary overflow-hidden">
        Welcome to {
          "Clinic".split("").map((l, index) => (
            <motion.span 
              variants={{
                initial: { y:"-100%"},
                animate:{ y: 0 }
              }}
              key={index} className="inline-block">{l}</motion.span>
          ))
        } EZ
      </motion.h1>
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
    </motion.div>
  )
}

export const HeroImage = () => {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      initial={{ opacity: 0, x: "100%" }}
      transition={{ duration: 2, type:"spring", bounce:0.5 }}
    
      className="absolute bottom-0 right-0 ~w-[30rem]/[40rem]">
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