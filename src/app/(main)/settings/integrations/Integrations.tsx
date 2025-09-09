"use client"
import {toast} from "sonner"
import ActionButton from "@components/ActionButton"
import Each from "@components/utils/Each"
import { useUser } from "@auth0/nextjs-auth0"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card"
import { getGoogleAuthUrl } from "@actions/google/auth.action"
import { Checkbox } from "@components/ui/checkbox"

interface UserPreferenceFormProps {
  integrations: {
    name: string,
    status: boolean,
  }[]
}

const apps = [
  {
    name: "Google Calendar",
    description: "Sync your Google Calendar events",
  },
]

export default function Integrations({integrations = []}: UserPreferenceFormProps){
  const {user} = useUser()

  const action = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    toast.promise(getGoogleAuthUrl(`${baseUrl}/api/google/code`), {
      loading: "Connecting to Google Calendar...",
      success: res => {
        if(res.status) window.open(res.data!, "_blank")
        return res.message
      },
      error: "Failed to connect to Google Calendar",
    })
  }

  return (
    <div>
      <Each
        of={apps}
        render={(app, index) => (
          <Card key={index} className="p-4">
            <CardHeader>
              <CardTitle>
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <span>{app.name}</span>
                  <form action={action}>
                    <ActionButton>Connect</ActionButton>
                  </form>
                </div>
              </CardTitle>
              <CardDescription>{app.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {
                integrations.map((integration, index) => (
                  <div key={index} className="items-top flex space-x-2">
                    <Checkbox id="google-calendar" checked={integration.status} />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="google-calendar"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enable {app.name}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {integration.status ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                ))
              }
            </CardContent>
            <CardFooter></CardFooter>
          </Card>
        )}
      />
    </div>
  )
}