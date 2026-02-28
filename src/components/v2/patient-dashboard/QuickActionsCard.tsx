"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, Beaker, Plus } from "lucide-react"

export default function QuickActionsCard() {
  const actions = [
    {
      icon: Calendar,
      label: "Book Appointment",
      description: "Schedule with a healthcare provider",
      href: "#",
    },
    {
      icon: MessageSquare,
      label: "Message Doctor",
      description: "Send a secure message",
      href: "#",
    },
    {
      icon: Beaker,
      label: "Request Lab Work",
      description: "Request new lab tests",
      href: "#",
    },
    {
      icon: Plus,
      label: "Add Records",
      description: "Upload medical documents",
      href: "#",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Card
            key={action.label}
            className="hover:shadow-md transition-shadow cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardTitle className="text-base">{action.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
