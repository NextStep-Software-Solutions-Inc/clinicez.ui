
import Image from "next/image";
import { DetailedHTMLProps, HTMLAttributes, Suspense, lazy } from "react";
import UserAvatarWrapper from "./UserAvatarWrapper";


interface IProcessHeaderProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>{}
export default function ProcessHeader({...props}: IProcessHeaderProps) {
  return (
    <header {...props} className={`bg-[#FCF8F1] bg-opacity-30 ${props.className}`}>
      <div className="px-4 mx-auto sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex-shrink-0">
            <a href="/" title="" className="flex">
              <Image
                width={100}
                height={100}
                className="w-auto" 
                src="https://i.postimg.cc/VsH4j92b/clinicez-logo.png" alt="" 
              />
            </a>
          </div>

          <button type="button" className="inline-flex p-2 text-black transition-all duration-200 rounded-md lg:hidden focus:bg-gray-100 hover:bg-gray-100">
            {/* <!-- Menu open: "hidden", Menu closed: "block" --> */}
            <svg className="block w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path>
            </svg>

            {/* <!-- Menu open: "block", Menu closed: "hidden" --> */}
            <svg className="hidden w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div className="hidden lg:flex lg:items-center lg:justify-center lg:space-x-10">
            {/* <Navigation/> */}
          </div>
          <div className="hidden lg:inline-flex items-center justify-center">
            <Suspense fallback={<div>Loading</div>}>
              <UserAvatarWrapper/>
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  )
}
