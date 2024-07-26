import { Button } from "@components/ui/button";
import { Construction, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";

export default function MaintenanceWarning() {
  return (
    <div className="container h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <Construction size={200} className="w-full"/>
        <h2 className="text-4xl font-bold tracking-tight">System Under Maintenance!</h2>
        <p className="text-sm text-muted-foreground">
          {`
            The system is currently under maintenance. 
            Please check back later.
          `}
        </p>
      </div>
     
    </div>
  );
};
