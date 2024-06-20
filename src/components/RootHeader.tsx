import { DetailedHTMLProps, HTMLAttributes, Suspense } from "react";
import Navigation from "@components/Navigation";

import AnimatedLogo from "./AnimatedLogo";
import RootDrawer from "./RootDrawer";
import { Button } from "./ui/button";
import UserAvatarWrapper from "./UserAvatarWrapper";


interface IRootHeaderProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>{}
export default function RootHeader({...props}: IRootHeaderProps) {
  
  return (
    <header {...props} className={`bg-[#FCF8F1] bg-opacity-30 backdrop-blur ${props.className}`}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="hidden lg:flex flex-shrink-0">
            <a href="/" title="" className="flex h-40">
              <AnimatedLogo/>
            </a>
          </div>
          <RootDrawer>
            <Button  variant="ghost" className="inline-flex p-2 text-black transition-all duration-200 rounded-md md:hidden focus:bg-gray-100 hover:bg-gray-100">
              {/* <!-- Menu open: "hidden", Menu closed: "block" --> */}
              <svg className="block w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path>
              </svg>

              {/* <!-- Menu open: "block", Menu closed: "hidden" --> */}
              <svg className="hidden w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </Button>
          </RootDrawer>
          
          <div className="hidden md:flex lg:items-center lg:justify-center lg:space-x-10">
            <Navigation/>
          </div>
          <div className=" lg:inline-flex items-center justify-center gap-2">
            <Suspense fallback={<div>Loading</div>}>
              <UserAvatarWrapper/>
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  )
}


