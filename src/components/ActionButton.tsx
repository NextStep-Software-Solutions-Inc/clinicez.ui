"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./ui/button";
import { LoaderCircle } from "lucide-react";


interface ActionButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ children, ...props }, ref) => {
    const { pending } = useFormStatus();
    return (
      <Button
        ref={ref}
        {...props}
        disabled={pending || props.disabled}
      >
        {pending && <LoaderCircle className="animate-spin transition-all mr-2" />}
        {children}
      </Button>
    );
  }
);

ActionButton.displayName = "ActionButton";

export default ActionButton;
