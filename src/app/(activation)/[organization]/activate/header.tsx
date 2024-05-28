import { DetailedHTMLProps, HTMLAttributes, Suspense } from "react";
import dynamic from "next/dynamic";

import AnimatedLogo from "@components/AnimatedLogo";
import { OrganizationSwitcher } from "@components/dashboard/OrganizationSwitcher";

const UserAvatar = dynamic(() => import("@components/UserAvatar"), {ssr: true});

interface IHeaderProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>{}
export default function Header({...props}: IHeaderProps) {
  
  return (
    <header {...props} className={`bg-[#FCF8F1] bg-opacity-30 backdrop-blur ${props.className}`}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex-shrink-0">
            <a href="/" title="" className="flex h-40">
              <AnimatedLogo/>
            </a>
          </div>

          <div className="inline-flex items-center justify-center gap-2">
            <OrganizationSwitcher isCollapsed/>
            <Suspense fallback={<div>Loading</div>}>
              <UserAvatar/>
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  )
}
