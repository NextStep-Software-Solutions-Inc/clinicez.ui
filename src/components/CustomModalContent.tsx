import React from "react";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { DialogContentProps } from "@radix-ui/react-dialog";

interface CustomModalContentProps extends DialogContentProps {
  children: React.ReactNode;
  label: React.ReactNode;
  description?: React.ReactNode;
}

export default function CustomModalContent({ children, label, description,  ...res }: CustomModalContentProps) {
  return (
    <DialogContent {...res}>
      <DialogHeader>
        <DialogTitle>{label}</DialogTitle>
        <DialogDescription>
          {description}
        </DialogDescription>
      </DialogHeader>
      <div className="overflow-scroll max-h-[90vh] no-scrollbar px-1">
        {children}
      </div>
    </DialogContent>
  );
}
