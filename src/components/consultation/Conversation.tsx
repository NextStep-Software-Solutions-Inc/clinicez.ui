"use client";

import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import { getConversationAction } from "@actions/consultations.action";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import Each from "@components/utils/Each";
import { cn } from "@lib/utils";
import { Send } from "lucide-react"
import React, { useEffect } from "react";

interface ConversationProps {
    consultation:  NonNullable<GetConsultationTicket["data"]>;
}

export default function Conversation({ consultation}: ConversationProps) {
  const [input, setInput] = React.useState("")
  const inputLength = input.trim().length
  const [messages, setMessages] = React.useState<{
    senderId: number
    content: string
  }[]>()

  useEffect(() => {
    const fetchConversation = async () => {
      const convo = await getConversationAction(consultation.id)
      setMessages(convo)
    }
    fetchConversation()
  }, [consultation.id])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation</CardTitle>
        <CardDescription>
          Thread of conversation between the patient and the healthcare provider.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Each
            of={messages ?? []}
            render={(message, index) => (
              <div
                className={cn(
                  "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                  message.senderId === 2 //  change to user id
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content}
              </div>
            )}
          />
        </div>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (inputLength === 0) return
            setMessages([
              ...messages ?? [],
              {
                senderId: 2, //  change to user id
                content: input,
              },
            ])
            setInput("")
          }}
          className="flex w-full items-center space-x-2"
        >
          <Input
            id="message"
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button type="submit" size="icon" disabled={inputLength === 0}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}


