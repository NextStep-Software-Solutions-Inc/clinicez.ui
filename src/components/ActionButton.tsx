"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./ui/button";
import { LoaderCircle } from "lucide-react";


interface ActionButtonProps extends ButtonProps {
    children: React.ReactNode;
}

export default function ActionButton({children, ...props}: ActionButtonProps) {
  const {pending} = useFormStatus();
  return (
    <Button {...props} disabled={pending || props.disabled} >{pending && <LoaderCircle className="animate-spin transition-all mr-2"/>}{children}</Button>
  );
}
