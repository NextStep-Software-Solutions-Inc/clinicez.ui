"use client";

import { Button } from "@components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet"

import { DialogProps } from "@radix-ui/react-dialog"
import { navLinks } from "./Navigation";
import DrawerNav from "../app/(process)/[organization]/DrawerNav";
interface RootDrawerProps extends DialogProps {
  children?: React.ReactNode;
}
export default function RootDrawer({ children, ...res }: RootDrawerProps) {
 
  return (
    <Sheet {...res}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Navigation Drawer</SheetTitle>
        </SheetHeader>
        <DrawerNav navItems={navLinks}/>
        
        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button variant="outline" type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
