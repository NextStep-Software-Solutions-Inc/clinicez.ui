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
import { navLinks, navLinksV2 } from "./Navigation";
import DrawerNav from "./dashboard/DrawerNav";
interface RootDrawerProps extends DialogProps {
  children?: React.ReactNode;
  version?: string;
}
export default function RootDrawer({ children, version, ...res }: RootDrawerProps) {
  const activeNavLinks = version === "v2" ? navLinksV2 : navLinks;

  return (
    <Sheet {...res}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Navigation Drawer</SheetTitle>
        </SheetHeader>
        <DrawerNav navItems={activeNavLinks}/>
        
        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button variant="outline" type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
