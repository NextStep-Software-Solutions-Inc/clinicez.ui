"use client";

import { Button } from "@components/ui/button"
import { toast } from "sonner"

export const ChangePlan = () => {

  const handleChange = () => {
    toast.info("We are working on this feature to allow you to change your plan by yourself. For now, please go to the Contact Us page and send us a message to change your plan. Thank you for your understanding.", {
      position: "top-center",
      duration: 10000
    })
  }

  return (
    <Button onClick={handleChange} size="sm" variant="outline">Change</Button>
  )
}