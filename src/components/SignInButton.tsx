"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { usePathname, useSearchParams } from "next/navigation";

export const SignInButton = () => {

  // get current path with query params
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = `${pathname}${searchParams ? `?${searchParams.toString()}` : ""}`;

  return (
    <Link href={`/auth/login?returnTo=${currentPath}`}>
      <Button className="mx-auto ~text-xs/sm ~h-8/10">Sign In</Button>
    </Link>
  );
};
