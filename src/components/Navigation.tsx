"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@components/ui/navigation-menu"
import Link from "next/link";
import Each from "./utils/Each";
import { cn } from "@lib/utils";
  
const navLinks = [
  { name: "Home", href: "/" },
  { name: "Doctors", href: "/healthcare-provider/doctors" },
  { name: "Nurses", href: "/healthcare-provider/nurses" },
  { name: "Organizations", href: "/organizations" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact Us", href: "/contact-us" }
  // { name: "Doctors", href: "/practitioners" }
];
export default function Navigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <Each
          of={navLinks}
          render={(link) => (
            <NavigationMenuItem>
              <Link href={link.href} legacyBehavior passHref>
                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(),
                  "bg-transparent"
                )}>
                  {link.name}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          )}
        />
      </NavigationMenuList>
    </NavigationMenu>
  );
}
