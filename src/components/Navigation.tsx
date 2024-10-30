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
import dynamicIconImports from "lucide-react/dynamicIconImports";
  
export const navLinks: {
  name: string;
  href: string;
  icon: keyof typeof dynamicIconImports;
}[]
= [
  { name: "Home", href: "/", icon: "home" },
  { name: "Our Healthcare Providers", href: "/hp", icon: "users"  },
  { name: "Clinics & Organizations", href: "/organizations", icon: "building"  },
  { name: "Pricing", href: "/pricing", icon: "coins"  },
  { name: "Contact Us", href: "/contact-us", icon: "contact"  }
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
