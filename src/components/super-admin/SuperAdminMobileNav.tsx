"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@components/ui/sheet";
import SidebarNav from "@components/SidebarNav";

interface SuperAdminMobileNavProps {
  items: { href: string; title: string }[];
}

export default function SuperAdminMobileNav({ items }: SuperAdminMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Manage system-wide settings and resources.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6" onClick={() => setOpen(false)}>
            <SidebarNav items={items} className="flex-col space-x-0 space-y-1" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
