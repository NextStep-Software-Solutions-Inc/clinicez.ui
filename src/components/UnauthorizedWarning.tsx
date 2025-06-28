import { Button } from "@components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedWarning() {
  return (
    <div className="container h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <ShieldAlert size={90} className="w-full"/>
        <h2 className="text-4xl font-bold tracking-tight">Unauthorized Access</h2>
        <p className="text-sm text-muted-foreground">
          {`You do not have permission to access the page`}
        </p>
        <Link href="/" legacyBehavior>
          <Button className="my-5">Go Home</Button>
        </Link>
      </div>
    </div>
  );
};
