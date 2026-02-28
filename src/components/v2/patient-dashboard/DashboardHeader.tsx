"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Calendar, FileText } from "lucide-react"
import ConditionalRender from "@/components/utils/ConditionalRender"

interface DashboardHeaderProps {
  userId: string
}

export default function DashboardHeader({ userId }: DashboardHeaderProps) {
  const { user } = useUser()

  if (!user) return null

  const initials = [user.firstName?.[0] || "", user.lastName?.[0] || ""].filter(Boolean).join("")
  const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Patient"

  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Left side: User info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.imageUrl} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-0.5">
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Right side: Quick status badges */}
          <div className="hidden md:flex items-center gap-3">
            <Badge variant="outline" className="gap-2 px-3 py-1">
              <Calendar className="h-4 w-4" />
              <span>Dashboard</span>
            </Badge>
            <Badge variant="secondary" className="gap-2 px-3 py-1">
              <MessageCircle className="h-4 w-4" />
              <span>0 Messages</span>
            </Badge>
            <Badge variant="secondary" className="gap-2 px-3 py-1">
              <FileText className="h-4 w-4" />
              <span>0 Pending</span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
