"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@components/ui/navigation-menu"
import Link from "next/link";
import Each from "./utils/Each";
import { cn } from "@lib/utils";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import React from "react";

const components: { name: string; href: string; description: string }[] = [
  {
    name: "Clinics",
    href: "/clinics",
    description: "Find a clinic near you. View their services, providers, and more.",
  },
  {
    name: "Organizations",
    href: "/organizations",
    description: "Organizations that use Clinic EZ to manage their healthcare services and providers.",
  }
]
export const navLinks: {
  name: string;
  href?: string;
  icon: keyof typeof dynamicIconImports;
  items?: { name: string; href: string, icon?: keyof typeof dynamicIconImports, description: string }[];
}[]
= [
  { name: "Home", href: "/", icon: "home" },
  { name: "Our Healthcare Providers", href: "/hp", icon: "users"  },
  { name: "Clinics & Organizations", icon: "building", items: components },
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
              {
                !!link.href 
                  ? (
                    <Link href={link.href} legacyBehavior passHref>
                      <NavigationMenuLink className={cn(navigationMenuTriggerStyle(),
                        "bg-transparent"
                      )}>
                        {link.name}
                      </NavigationMenuLink>
                    </Link>
                  )
                  : (
                    <>
                      <NavigationMenuTrigger className="bg-transparent">{link.name}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                          {components.map((component) => (
                            <ListItem
                              key={component.name}
                              title={component.name}
                              href={component.href}
                            >
                              {component.description}
                            </ListItem>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  )
              }
          
            </NavigationMenuItem>
          )}
        />
        
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-semibold leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"