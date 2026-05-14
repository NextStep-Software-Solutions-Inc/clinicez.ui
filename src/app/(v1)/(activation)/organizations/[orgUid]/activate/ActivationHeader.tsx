import { DetailedHTMLProps, HTMLAttributes, Suspense } from "react";
import Link from "next/link";

import AnimatedLogo from "@components/AnimatedLogo";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import UserAvatarWrapper from "@components/UserAvatarWrapper";


interface IActivationHeaderProps extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>{}
export default function ActivationHeader({...props}: IActivationHeaderProps) {
  
  return (
    <header {...props} className={`bg-[#FCF8F1] bg-opacity-30 backdrop-blur ${props.className}`}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex-shrink-0">
            <Link href="/" title="" className="flex h-40">
              <AnimatedLogo/>
            </Link>
          </div>

          <div className="inline-flex items-center justify-center gap-2">
            <OrganizationSwitcher isCollapsed/>
            <Suspense fallback={<div>Loading</div>}>
              <UserAvatarWrapper/>
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  )
}
