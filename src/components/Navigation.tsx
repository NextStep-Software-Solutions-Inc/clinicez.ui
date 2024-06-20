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
import { Building, Coins, Contact, Home, Users } from "lucide-react";
  
export const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Doctors", href: "/hp/doctors", icon: Users  },
  { name: "Nurses", href: "/hp/nurses", icon: Users  },
  { name: "Organizations", href: "/organizations", icon: Building  },
  { name: "Pricing", href: "/pricing", icon: Coins  },
  { name: "Contact Us", href: "/contact-us", icon: Contact  }
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
