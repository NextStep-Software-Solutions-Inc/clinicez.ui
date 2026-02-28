import "@styles/globals.css";
import Link from "next/link";
import { LifeBuoy, PanelLeft, Search, Settings, UserRound } from "lucide-react";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@components/ui/sheet";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import Breadcrumb from "@components/dashboard/Breadcrumb";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import SideNav from "@components/dashboard/SideNav";
import DrawerNav from "@components/dashboard/DrawerNav";
import { filterNavList } from "./nav";


import ClinicEzMiniLogo from "@public/assets/clinic-ez_mini-logo.svg";
import Image from "next/image";
import { isOrgMember } from "@lib/org-utils";
import { Suspense } from "react";
import UserAvatarWrapper from "@components/UserAvatarWrapper";
import Suspend from "@components/Suspend";
import { getCachedSession } from "@actions/session.action";
import UnauthorizedWarning from "@/components/UnauthorizedWarning";

interface ProcessLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    orgUid: string;
  }>;
}
export default async function ProcessLayout(props: ProcessLayoutProps) {
  const params = await props.params;

  const {
    orgUid
  } = params;

  const {
    children
  } = props;

  const [session, isMember] = await Promise.all([
    getCachedSession(),
    isOrgMember(orgUid)
  ]);

  if (!isMember) return <UnauthorizedWarning/>;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
              href="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full ring-primary ring-2 text-lg font-semibold md:h-8 md:w-8 md:text-base transition-all hover:scale-125"
            >
              <Image
                src={ClinicEzMiniLogo}
                width={100}
                height={100}
                alt="mini-logo"
                className="h-5 w-5"
              />
              <span className="sr-only">Clinic EZ</span>
            </Link>
            <SideNav navItems={filterNavList()} params={["organizations", "orgUid"]}/>
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="profile"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <LifeBuoy className="h-5 w-5" />
                  <span className="sr-only">Organization Support</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Organization Support</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/organizations/${orgUid}/membership/${session?.user.sub}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <UserRound className="h-5 w-5" />
                  <span className="sr-only">My Organization Profile</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                My Organization Profile
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/organizations/${orgUid}/org-settings`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Organization Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                Organization Settings
              </TooltipContent>
            </Tooltip>
          </nav>
        </aside>
        <div className="flex-1 flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="sm:hidden"
                >
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="sm:max-w-xs"
              >
                <nav className="grid gap-6 text-lg font-medium">
                  <DrawerNav navItems={filterNavList()} />
                  <Link
                    href="/dashboard/settings"
                    className="mt-auto flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <Breadcrumb />
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              />
            </div>
            <div className="max-w-xs">
              <Suspend>
                <OrganizationSwitcher isCollapsed />
              </Suspend>
            </div>
            <Suspense fallback={<div>Loading</div>}>
              <UserAvatarWrapper />
            </Suspense>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
