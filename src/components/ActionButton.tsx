"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./ui/button";


interface ActionButtonProps extends ButtonProps {
    children: React.ReactNode;
}

export default function ActionButton({children, ...props}: ActionButtonProps) {
  const {pending} = useFormStatus();
  return (
    <Button disabled={pending} {...props}>{children}</Button>
  );
}
