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
import { FaCirclePlay } from "react-icons/fa6";
import HeaderTitle from "./HeaderTitle";
import SectionA from "./SectionA";
import SectionImage from "@public/assets/c25199c92e82170f91b82790f93db3c40d32d6d7.png"
import SectionB from "./SectionB";
interface ButtonItem {
  href: string
  description: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive" | "outline-2"
  icon?: React.ReactNode
  style?: string
}

interface TitleItem {
  text: string
  className?: string
  breakLine?: boolean
}

interface HeroData {
  tagline: string
  title: TitleItem[]
  description: string
  button: ButtonItem[]
}

interface HeroFeatureSet {
  hero?: HeroData
  pricing?: HeroData
  [key: string]: HeroData | undefined
}

const heroTitle: HeroFeatureSet[] = [
  {
    hero: {
      tagline: "Proven & Ready — Now Accepting New Partners",
      title: [{ text: "Streamline Your " }, { text: "Healthcare Practice", className: "text-primary", breakLine: true }],
      description:
        "Complete healthcare management system that simplifies appointment booking, patient records, and clinic operations. Proven effective with our educational healthcare partner.",
      button: [
        {
          description: "Register Now",
          href: "/tenants/register",
          icon: null,
          variant: "default",
          style: "",
        },
        {
          description: "Watch free demo",
          href: "https://www.youtube.com/@ClinicEZ",
          icon: <FaCirclePlay fill="hsl(var(--primary)" size={24} />,
          variant: "outline-2",
          style: "text-primary"
        },
      ],
    },
    pricing: {
      tagline: "Healthcare Management Made Simple",
      title: [{ text: "Get a " }, { text: " Quote ", className: "text-primary" }, { text: "for Your " }, { text: "Healthcare Solution", breakLine: true }],
      description: "Pricing details will be available soon. Contact us for early access or custom inquiries. Transform your healthcare practice with our comprehensive management platform.",
      button: [
        {
          description: "Get a Quote",
          href: "#",
          icon: null,
          variant: "default",
          style: "",
        },
        {
          description: "Watch free demo",
          href: "https://www.youtube.com/@ClinicEZ",
          icon: null,
          variant: "outline-2",
          style: "text-primary"
        },
      ],
    },
  },
]

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

const topFeaturesV2 = [
  {
    hero: [
      {
        version: "A",
        title: "Everthing You Need, Already Built",
        description: "Our comprehensive platform handles all aspects of healthcare practice management features that are tested and ready to deploy.",
        image: undefined,
        className: ' ',
        card: [
          {
            icon: "calendar-days" as const,
            title: "Smart Appointment Booking",
            description: "24/7 online booking with automated reminders and calendar sync. Reduce scheduling conflicts and no-shows."
          },
          {
            icon: "users" as const,
            title: "Patient Management",
            description: "Complete patient profiles, medical history, and secure document storage in one centralized system.",
          },
          {
            icon: "clock-4" as const,
            title: "Real-time Scheduling",
            description: "Dynamic scheduling with conflict detection and automatic optimization for maximum efficiency.",
          },
        ],
      },
      {
        version: "B",
        title: "Interested in Clinicez?",
        description: "Schedule a personalized demo to see how Clinicez can streamline your healthcare operations.",
        placeholder: "Enter your email",
        btnVal: "Get Started",
      },
      {
        version: "A",
        title: "Ready to Expand to More Healthcare Providers",
        image: {
          src: SectionImage.src,
          alt: "Helping aid doctor",
        },
        card: [
          {
            icon: "shield" as const,
            title: "Proven Realibility",
            description: "Battle-tested in real healthcare environments.",
          },
          {
            icon: "user" as const,
            title: "User-Friendly",
            description: "Intuitive design that healthcare staff love."
          },
          {
            icon: "zap" as const,
            title: "Quick Implementation",
            description: "Fast setup with comprehensive support.",
          },
        ],
      },
      {
        version: "B",
        title: "Built by Healthcare Technology Experts",
        description: "Our team combines deep healthcare industry knowledge with modern technology expertise to create solutions that actually work in real healthcare environments.",
        placeholder: "",
        btnVal: "Get Started",
      }
    ],
    pricing: [
      {
        version: "A",
        image: undefined,
        className: "bg-transparent",
        card: [
          {
            icon: "users" as const,
            title: "Healthcare Providers",
            description: "Streamline your practice management with our comprehensive tools",
          },
          {
            icon: "users" as const,
            title: "Patient Management",
            description: "Compelte patient profiles, medical history, and secure document storage in one centralized system."
          },
          {
            icon: "clock-4" as const,
            title: "Real-time Scheduling",
            description: "Dynamic scheduling with conflict detection and automatic optimization for maximum efficiency.",
          },
        ],
      },
    ],
  },
];

export default function FeatureItems({ version = "v1", page = "hero" }) {
  if (version === "v2") {
    const featureSet = topFeaturesV2.find((feature) => page in feature)

    if (featureSet && page in featureSet) {
      const pageFeatures = featureSet[page as keyof typeof featureSet] as any[]

      return (
        <div className="w-full">
          <Each
            of={pageFeatures}
            render={(feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 300 * (index % 2 === 0 ? -1 : 1) }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.5,
                  type: "spring",
                  bounce: 0.5,
                  damping: 10,
                  stiffness: 100,
                }}
              >
                {feature.version === "A" ? (
                  <SectionA
                    key={index}
                    title={feature.title}
                    description={feature.description}
                    card={feature.card}
                    image={feature.image}
                    className={feature.className}
                  />
                ) : (
                  <SectionB
                    header={feature.title}
                    description={feature.description}
                    placeholder={feature.placeholder}
                    btnVal={feature.btnVal}
                    className="text-center"
                  />
                )}
              </motion.div>
            )}
          />
        </div>
      )
    }
  }


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

export const HeroTitle = ({
  authenticated = false,
  version = "v1",
  page = "hero",
}: {
  authenticated?: boolean
  version?: "v1" | "v2"
  page?: string
}) => {
  if (version === "v2") {
    const featureSet = heroTitle.find((feature) => page in feature)

    if (featureSet && page in featureSet) {
      const pageFeatures = featureSet[page as keyof typeof featureSet] as HeroData

      if (!pageFeatures) return null;

      return (
        <motion.div
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="min-h-full mx-auto"
        >
          <div className="flex justify-center">
            <p className="inline-block text-xs md:text-sm lg:text-base font-semibold bg-teal-100 text-primary mb-4 rounded-full px-4 py-1">
              {pageFeatures.tagline}
            </p>
          </div>

          <HeaderTitle
            header={pageFeatures.title}
            description={pageFeatures.description}
          />

          <ConditionalRender condition={!authenticated}>
            <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center items-center max-w-md sm:max-w-none mx-auto">
              {pageFeatures.button.map((item, index) => (
                <Link href={item.href} key={index} className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="text-sm h-10 flex items-center justify-center gap-2 px-4 py-5 w-full sm:w-auto"
                    variant={item.variant || "default"}
                  >
                    {item.icon && <span className="flex items-center justify-center w-4 h-4">{item.icon}</span>}
                    <span className={item.style || ""}>{item.description}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </ConditionalRender>

          <ConditionalRender condition={authenticated}>
            <div className="flex justify-center mt-6">
              <Link href="/organizations">
                <Button className="h-10">
                  <Rocket size={18} className="mr-1" />
                  Get Started
                </Button>
              </Link>
            </div>
          </ConditionalRender>
        </motion.div>
      )
    }
  }

  return (
    <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: 1, delay: 0.5 }}>
      <p className="text-center lg:text-left text-6xl font-extrabold tracking-wider text-gray-500">
        Optimized Healthcare Management System
      </p>

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
            <Button className="mx-auto h-10 mt-10">
              <Rocket size={18} className="mr-1" />
              Get Started
            </Button>
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