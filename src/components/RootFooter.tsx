import { FaFacebook, FaTwitter } from "react-icons/fa6"
import { AiFillInstagram } from "react-icons/ai"
import { BsSlack } from "react-icons/bs"
import AnimatedLogo from "./AnimatedLogo"
import Link from "next/link"
import { Separator } from "./ui/separator"
import Image from "next/image"
import ClinicEzLogo from "@public/assets/clinic-ez_logo.svg";

interface FooterProps {
  version?: string
}

const footerLinks = [
  {
    title: "About",
    link: "#",
  },
  {
    title: "Features",
    link: "#",
  },
  {
    title: "Works",
    link: "#",
  },
  {
    title: "Support",
    link: "#",
  },
  {
    title: "Help",
    link: "#",
  },
];

const socialIcons = [
  {
    alt: "facebook",
    icon: <FaFacebook />,
    link: "#",
  },
  {
    alt: "instagram",
    icon: <AiFillInstagram />,
    link: "#",
  },
  {
    alt: "slack",
    icon: <BsSlack />,
    link: "#",
  },
  {
    alt: "twitter",
    icon: <FaTwitter />,
    link: "#",
  },
];

const legalTerms = [
  {
    title: "Privacy Policy",
    link: "/v2/privacy",
  },
  {
    title: "Terms of Conditions",
    link: "/v2/terms",
  }
];

const fullYear = new Date().getFullYear()
const appEmail = process.env.NEXT_PUBLIC_APP_EMAIL

const RootFooter = ({ version = "v1" }: FooterProps) => {
  if (version === "v2") {
    return (
      <footer className="bg-slate-50 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col justify-center items-center space-y-8">
            <a href="/">
              <Image
                src={ClinicEzLogo}
                width={120}
                height={120}
                alt="logo"
              />
            </a>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8">
              {footerLinks.map((item, index) => {
                return (
                  <Link
                    href={item.link}
                    key={index}
                    className="text-gray-700 hover:text-primary transition-colors text-center"
                  >
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>

            <Separator className="w-48" />

            <div className="flex gap-6">
              {socialIcons.map((item, index) => {
                return (
                  <Link
                    href={item.link}
                    key={index}
                    className="text-2xl text-gray-700 hover:text-primary transition-colors"
                  >
                    <span className="w-6 h-6 flex items-center justify-center">{item.icon}</span>
                  </Link>
                )
              })}
            </div>

            <p className="text-center text-sm text-gray-600">
              <span>&copy; Copyright {fullYear} </span>
              <span>PointersBit Inc.</span>, All rights reserved.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-4">
              {legalTerms.map((item, index) => {
                return (
                  <Link
                    href={item.link}
                    key={index}
                    className="text-sm text-gray-700 hover:text-primary transition-colors text-center"
                  >
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="py-8 bg-slate-50">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 ~text-sm/base">
        <div className="order-1 sm:order-first">
          <a href="/" className="flex h-20">
            <AnimatedLogo />
          </a>
          <p className="mt-2">
            <strong>Clinic EZ</strong> is a platform that connects healthcare providers with patients. We provide a platform for healthcare providers to manage their appointments and patients to book appointments with their healthcare providers.
            Join our platform and be part of the future of healthcare.
          </p>
          <p className="space-x-2 my-5">
            <span className="font-bold">&copy; {fullYear}</span>
            <span className="font-bold text-primary">PointersBit Inc.</span>,
            All rights reserved.</p>
        </div>
        <div className="flex flex-wrap justify-between md:mt-8 ">
          <div className="w-full md:w-1/3 text-center sm:text-left">
            <h5 className="mb-4 font-semibold">Links</h5>
            <ul className="mb-4 ">
              <li className="">
                <a href="/organizations" className="hover:underline hover:text-primary">Clinics & Organizations</a>
              </li>
              <li className="">
                <a href="/hp" className="hover:underline hover:text-primary">Our Healthcare Providers</a>
              </li>
              <li className="">
                <a href="/tenants/register" className="hover:underline hover:text-primary">Be a Tenant</a>
              </li>
              <li className="">
                <a href="/hp/apply" className="hover:underline hover:text-primary">Apply as Healthcare Provider</a>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/3 text-center sm:text-left">
            <h5 className="mb-4 font-semibold">Legal</h5>
            <div className="mb-4">
              <a href="/terms" className="hover:underline hover:text-primary">Terms</a>
              <a href="/privacy" className="hover:underline hover:text-primary ml-4">Privacy</a>
            </div>
          </div>
          <div className="w-full md:w-1/3 text-center sm:text-left">
            <h5 className="mb-4 font-semibold">Contact</h5>
            <p><a href={`mailto:${appEmail}`} className="mb-6">{appEmail}</a></p>
            {/* <p><a href={`tel:09123456789`} className="mb-6">09123456789</a></p> */}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default RootFooter
