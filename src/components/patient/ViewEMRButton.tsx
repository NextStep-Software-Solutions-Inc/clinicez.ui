"use client"

import { Button } from "@components/ui/button"

export const ViewEMRButton = ({userId}: {userId: string}) => {
    
  const handleViewEMR = () => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("emr", userId)
    window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`)
  }

  return (
    <Button onClick={handleViewEMR} size="sm" variant="link">Preview EMR</Button>
  )
}