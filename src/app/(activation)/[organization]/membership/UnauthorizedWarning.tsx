"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";

export const UnauthorizedWarning = () => {
  const router = useRouter();
  
  useEffect(() => {
    toast.warning("You do not have permission to access this page. Redirecting to home page...", {
      position: "top-center",
      duration: 5000,
    });
    const timer = setTimeout(() => {
      toast.warning("Redirecting to home page...");
      return router.replace("/");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto my-10">
      <div className="text-center space-y-6">
        <h2 className="text-4xl font-bold tracking-tight">Unauthorized Access</h2>
        <p className="text-sm text-muted-foreground">
          {`You do not have permission to access this page. Redirecting to home page...`}
        </p>
      </div>
     
    </div>
  );
};
