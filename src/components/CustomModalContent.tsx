import React from "react";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { DialogContentProps } from "@radix-ui/react-dialog";

interface CustomModalContentProps extends DialogContentProps {
  children: React.ReactNode;
  label: React.ReactNode;
  description?: React.ReactNode;
}

export default function CustomModalContent({ children, label, description }: CustomModalContentProps) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{label}</DialogTitle>
        <DialogDescription>
          {description}
        </DialogDescription>
      </DialogHeader>
      {children}
    </DialogContent>
  );
}
